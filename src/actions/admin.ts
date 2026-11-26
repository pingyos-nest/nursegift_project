"use server";

import { revalidatePath, updateTag } from "next/cache";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import * as XLSX from "xlsx";
import { pool } from "@/lib/db";
import { getCurrentUser, requireAdmin } from "@/lib/auth/guard";
import { logActivity } from "@/lib/data/activity";
import { getWinnersForGift, KIND_LABEL, liveKey, TABLES, type Kind, type WinnerRecord } from "@/lib/data/admin";
import { locales } from "@/lib/i18n";
import { fallback } from "@/lib/i18n/fallback";

export type ActionResult = { ok: true; message?: string } | { ok: false; message: string; code?: string };

const MAX_PRIZES_PER_PERSON = 2;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const fail = (message: string, code?: string): ActionResult => ({ ok: false, message, code });
const isKind = (k: unknown): k is Kind => k === "main" || k === "sub";
const toInt = (v: unknown) => {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : 0;
};

async function run(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await fn();
  } catch (err) {
    // redirect()/notFound() throw special errors that must propagate.
    if (err && typeof err === "object" && "digest" in err) throw err;
    console.error(err);
    return fail("เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่");
  }
}

function refreshAdmin() {
  revalidatePath("/admin", "layout");
}

// ============ Gifts ============

export async function addGift(kind: Kind, giftname: string, datagroup?: number): Promise<ActionResult> {
  return run(async () => {
    const user = await getCurrentUser();
    const name = giftname.trim();
    const dg = toInt(datagroup);
    if (!isKind(kind) || !name || dg <= 0) return fail("ข้อมูลไม่ครบถ้วน");
    await pool.query(`INSERT INTO ${TABLES[kind].gift} (giftname, datagroup) VALUES (?, ?)`, [name, dg]);
    await logActivity(user.email, kind === "main" ? "add_gift" : "add_gift_sub", `เพิ่ม${KIND_LABEL[kind]}: ${name} (ชุด ${dg})`);
    refreshAdmin();
    return { ok: true, message: "เพิ่มข้อมูลสำเร็จ" };
  });
}

export async function editGift(kind: Kind, id: number, giftname: string, datagroup?: number): Promise<ActionResult> {
  return run(async () => {
    const user = await getCurrentUser();
    const name = giftname.trim();
    const dg = toInt(datagroup);
    if (!isKind(kind) || toInt(id) <= 0 || !name || dg <= 0) return fail("ข้อมูลไม่ครบถ้วน");
    await pool.query(`UPDATE ${TABLES[kind].gift} SET giftname = ?, datagroup = ? WHERE id = ?`, [name, dg, id]);
    await logActivity(user.email, kind === "main" ? "edit_gift" : "edit_gift_sub", `แก้ไข${KIND_LABEL[kind]} ID: ${id} - ${name} (ชุด ${dg})`);
    refreshAdmin();
    return { ok: true, message: "แก้ไขสำเร็จ" };
  });
}

export async function deleteGift(kind: Kind, id: number): Promise<ActionResult> {
  return run(async () => {
    const user = await getCurrentUser();
    if (!isKind(kind) || toInt(id) <= 0) return fail("ID ไม่ถูกต้อง");
    await pool.query(`DELETE FROM ${TABLES[kind].gift} WHERE id = ?`, [id]);
    await logActivity(user.email, kind === "main" ? "delete_gift" : "delete_gift_sub", `ลบรางวัล${kind === "sub" ? "ย่อย" : ""} ID: ${id}`);
    refreshAdmin();
    return { ok: true, message: "ลบสำเร็จ" };
  });
}

// ============ Groups ============

export async function addGroup(datagroup: number): Promise<ActionResult> {
  return run(async () => {
    const user = await getCurrentUser();
    const dg = toInt(datagroup);
    if (dg <= 0) return fail("ระบุชุดข้อมูลไม่ถูกต้อง");
    const [exists] = await pool.query<RowDataPacket[]>("SELECT 1 FROM `group` WHERE datagroup = ?", [dg]);
    if (exists.length) return fail("มีชุดข้อมูลนี้แล้ว");
    await pool.query("INSERT INTO `group` (datagroup) VALUES (?)", [dg]);
    await logActivity(user.email, "add_group", `เพิ่มชุดรางวัลที่ ${dg}`);
    refreshAdmin();
    return { ok: true, message: "เพิ่มชุดข้อมูลสำเร็จ" };
  });
}

export async function deleteGroup(datagroup: number): Promise<ActionResult> {
  return run(async () => {
    const user = await getCurrentUser();
    const dg = toInt(datagroup);
    if (dg <= 0) return fail("ข้อมูลไม่ถูกต้อง");
    await pool.query("DELETE FROM `group` WHERE datagroup = ?", [dg]);
    await logActivity(user.email, "delete_group", `ลบชุดรางวัลที่ ${dg}`);
    refreshAdmin();
    return { ok: true, message: "ลบสำเร็จ" };
  });
}

// ============ Excel / CSV import ============

const HEADER_PATTERNS = ["ชื่อ", "รางวัล", "name", "gift", "prize", "item", "ลำดับ", "no", "#"];
const looksLikeHeader = (s: string) => HEADER_PATTERNS.some((p) => s.toLowerCase().includes(p.toLowerCase()));

function isSpreadsheet(bytes: Uint8Array, ext: string) {
  if (ext === "csv") return true;
  const zip = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04; // xlsx
  const ole = bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0; // xls
  return zip || ole;
}

export async function importGifts(kind: Kind, formData: FormData): Promise<ActionResult> {
  return run(async () => {
    const user = await getCurrentUser();
    if (!isKind(kind)) return fail("ประเภทไม่ถูกต้อง");
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return fail("กรุณาเลือกไฟล์ที่ต้องการนำเข้า");
    if (file.size > MAX_UPLOAD_BYTES) return fail("ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)");

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["xls", "xlsx", "csv"].includes(ext)) return fail("รูปแบบไฟล์ไม่ถูกต้อง (รองรับ .xls, .xlsx, .csv)");
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!isSpreadsheet(bytes, ext)) return fail("ไฟล์ไม่ถูกต้อง - ลายเซ็นไฟล์ไม่ตรงกับ Excel");

    let rows: unknown[][];
    try {
      const wb = ext === "csv"
        ? XLSX.read(new TextDecoder("utf-8").decode(bytes).replace(/^﻿/, ""), { type: "string", raw: true })
        : XLSX.read(bytes, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, blankrows: true, defval: "" });
    } catch {
      return fail("ไม่สามารถอ่านไฟล์ได้");
    }

    const items: { giftname: string; datagroup: number }[] = [];
    const errors: string[] = [];
    let firstRow = true;

    rows.forEach((row, i) => {
      const rowNum = i + 1;
      const giftname = String(row[0] ?? "").trim();
      const datagroup = toInt(row[1]);
      if (!giftname) {
        errors.push(`แถวที่ ${rowNum}: ไม่มีชื่อรางวัล`);
        return;
      }
      if (firstRow) {
        firstRow = false;
        if (looksLikeHeader(giftname) || datagroup <= 0) return;
      }
      if ([...giftname].length > 500) return void errors.push(`แถวที่ ${rowNum}: ชื่อยาวเกินไป`);
      if (datagroup <= 0) return void errors.push(`แถวที่ ${rowNum}: ชุดรางวัลไม่ถูกต้อง`);
      items.push({ giftname, datagroup });
    });

    if (items.length === 0) {
      return fail(`ไม่มีข้อมูลที่สามารถนำเข้าได้: ${errors.slice(0, 3).join(", ") || "ไม่พบข้อมูลที่ถูกต้อง"}`);
    }

    const conn = await pool.getConnection();
    const newGroups: number[] = [];
    try {
      await conn.beginTransaction();
      const t = TABLES[kind];
      const [existing] = await conn.query<RowDataPacket[]>("SELECT datagroup FROM `group`");
      const have = new Set(existing.map((r) => Number(r.datagroup)));
      for (const dg of new Set(items.map((i) => i.datagroup))) {
        if (!have.has(dg)) {
          await conn.query("INSERT INTO `group` (datagroup) VALUES (?)", [dg]);
          newGroups.push(dg);
        }
      }
      await conn.query(`INSERT INTO ${t.gift} (giftname, datagroup) VALUES ?`, [items.map((i) => [i.giftname, i.datagroup])]);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    let message = `นำเข้าสำเร็จ ${items.length} รายการ`;
    if (newGroups.length) message += ` (สร้างกลุ่มใหม่: ชุดที่ ${newGroups.sort((a, b) => a - b).join(", ")})`;
    if (errors.length) message += ` (ข้าม ${errors.length} แถว)`;
    await logActivity(
      user.email,
      kind === "main" ? "import_excel" : "import_excel_sub",
      `นำเข้า${KIND_LABEL[kind]} ${items.length} รายการ, สร้างชุดใหม่ ${newGroups.length} ชุด`,
    );
    refreshAdmin();
    return { ok: true, message };
  });
}

// ============ Winners ============

export async function fetchWinners(kind: Kind, giftId: number): Promise<WinnerRecord[]> {
  await getCurrentUser();
  if (!isKind(kind) || toInt(giftId) <= 0) return [];
  return getWinnersForGift(kind, giftId);
}

export async function addWinner(kind: Kind, giftId: number, rawName: string): Promise<ActionResult> {
  return run(async () => {
    const user = await getCurrentUser();
    const name = rawName.trim();
    if (!isKind(kind) || !name || toInt(giftId) <= 0) return fail("ข้อมูลไม่ครบถ้วน");

    const t = TABLES[kind];
    const [gift] = await pool.query<RowDataPacket[]>(`SELECT id, giftname FROM ${t.gift} WHERE id = ?`, [giftId]);
    if (!gift.length) return fail("ไม่พบของรางวัลนี้ในระบบ");

    // Rule: 1 person = max 2 prizes across main + sub.
    const [cnt] = await pool.query<RowDataPacket[]>(
      "SELECT (SELECT COUNT(*) FROM user WHERE name = ?) + (SELECT COUNT(*) FROM user_sub WHERE name = ?) AS total",
      [name, name],
    );
    if (Number(cnt[0].total) >= MAX_PRIZES_PER_PERSON) {
      return fail(
        `ผู้โชคดีนี้ได้รับรางวัลครบ ${MAX_PRIZES_PER_PERSON} ชิ้นแล้ว (รวมรางวัลใหญ่+ย่อย) กฎ: 1 คน = สูงสุด ${MAX_PRIZES_PER_PERSON} รางวัล`,
        "already_received",
      );
    }

    const giftname = gift[0].giftname as string;
    await pool.query(`INSERT INTO ${t.winner} (name, groupId, giftname, dateCreate) VALUES (?, ?, ?, NOW())`, [name, giftId, giftname]);
    await logActivity(user.email, kind === "main" ? "add_winner" : "add_winner_sub", `เพิ่มผู้โชคดี: ${name} (รางวัล: ${giftname})`);
    refreshAdmin();
    return { ok: true, message: "บันทึกสำเร็จ" };
  });
}

export async function deleteWinner(kind: Kind, winnerId: number): Promise<ActionResult> {
  return run(async () => {
    const user = await getCurrentUser();
    if (!isKind(kind) || toInt(winnerId) <= 0) return fail("ข้อมูลไม่ถูกต้อง");
    const t = TABLES[kind];
    const [rows] = await pool.query<RowDataPacket[]>(`SELECT name, giftname FROM ${t.winner} WHERE id = ?`, [winnerId]);
    const [res] = await pool.query<ResultSetHeader>(`DELETE FROM ${t.winner} WHERE id = ?`, [winnerId]);
    if (res.affectedRows === 0) return fail("ไม่สามารถลบได้");
    await logActivity(user.email, kind === "main" ? "delete_winner" : "delete_winner_sub", `ลบผู้โชคดี: ${rows[0]?.name} (รางวัล: ${rows[0]?.giftname})`);
    refreshAdmin();
    return { ok: true, message: "ลบสำเร็จ" };
  });
}

// ============ Live visibility ============

export async function setLiveVisibility(kind: Kind, visible: boolean, datagroup: number): Promise<ActionResult> {
  return run(async () => {
    const user = await getCurrentUser();
    if (!isKind(kind) || toInt(datagroup) <= 0) return fail("ประเภทไม่ถูกต้อง");
    const key = liveKey(kind, toInt(datagroup));
    const value = visible ? "1" : "0";
    await pool.query(
      "INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()",
      [key, value],
    );
    await logActivity(user.email, "toggle_live", `${visible ? "เปิด" : "ปิด"} การแสดงผล: ${key}`);
    refreshAdmin();
    return { ok: true, message: visible ? "เปิดการแสดงผลในหน้า Live" : "ปิดการแสดงผลในหน้า Live" };
  });
}

// ============ Languages (admin) ============

export async function saveLanguage(code: string, entries: Record<string, string>): Promise<ActionResult> {
  return run(async () => {
    const user = await requireAdmin();
    if (!(locales as readonly string[]).includes(code)) return fail("รหัสภาษาไม่ถูกต้อง");
    const allowed = new Set(Object.keys(fallback.th));
    const rows = Object.entries(entries).filter(([k]) => allowed.has(k)).map(([k, v]) => [code, k, String(v)]);
    if (!rows.length) return fail("ไม่มีข้อมูลที่จะบันทึก");
    await pool.query(
      "INSERT INTO languages (lang_code, lang_key, lang_value) VALUES ? ON DUPLICATE KEY UPDATE lang_value = VALUES(lang_value), updated_at = NOW()",
      [rows],
    );
    updateTag("languages"); // public pages pick up the new text immediately
    await logActivity(user.email, "save_language", `บันทึกภาษา: ${code} (${rows.length} รายการ)`);
    return { ok: true, message: `บันทึกภาษา ${code} สำเร็จ (${rows.length} รายการ)` };
  });
}

// ============ Users (admin) ============

export async function addUser(email: string, name: string, role: string): Promise<ActionResult> {
  return run(async () => {
    const me = await requireAdmin();
    const e = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+$/.test(e)) return fail("อีเมลไม่ถูกต้อง");
    const r = role === "admin" ? "admin" : "user";
    try {
      await pool.query("INSERT INTO backend_users (email, name, role, status) VALUES (?, ?, ?, 1)", [e, name.trim(), r]);
    } catch (err) {
      if ((err as { code?: string }).code === "ER_DUP_ENTRY") return fail("อีเมลนี้มีอยู่ในระบบแล้ว");
      throw err;
    }
    await logActivity(me.email, "add_user", `เพิ่มผู้ใช้: ${e} (${r})`);
    refreshAdmin();
    return { ok: true, message: "เพิ่มผู้ใช้สำเร็จ" };
  });
}

async function targetEmail(id: number) {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT email FROM backend_users WHERE id = ?", [id]);
  return rows[0]?.email as string | undefined;
}

export async function updateUser(id: number, change: { role?: string; toggleStatus?: boolean }): Promise<ActionResult> {
  return run(async () => {
    const me = await requireAdmin();
    const email = await targetEmail(toInt(id));
    if (!email) return fail("ไม่พบผู้ใช้");
    if (email.toLowerCase() === me.email.toLowerCase()) return fail("ไม่สามารถแก้ไขสิทธิ์ของตัวเองได้");
    if (change.role) {
      const r = change.role === "admin" ? "admin" : "user";
      await pool.query("UPDATE backend_users SET role = ? WHERE id = ?", [r, id]);
      await logActivity(me.email, "update_user_role", `${email} → ${r}`);
    }
    if (change.toggleStatus) {
      await pool.query("UPDATE backend_users SET status = NOT status WHERE id = ?", [id]);
      await logActivity(me.email, "toggle_user_status", email);
    }
    refreshAdmin();
    return { ok: true, message: "อัปเดตสำเร็จ" };
  });
}

export async function deleteUser(id: number): Promise<ActionResult> {
  return run(async () => {
    const me = await requireAdmin();
    const email = await targetEmail(toInt(id));
    if (!email) return fail("ไม่พบผู้ใช้");
    if (email.toLowerCase() === me.email.toLowerCase()) return fail("ไม่สามารถลบตัวเองได้");
    await pool.query("DELETE FROM backend_users WHERE id = ?", [id]);
    await logActivity(me.email, "delete_user", email);
    refreshAdmin();
    return { ok: true, message: "ลบผู้ใช้สำเร็จ" };
  });
}

// ============ Restore (admin) ============

type Row = Record<string, unknown>;

export async function restoreBackup(formData: FormData): Promise<ActionResult> {
  return run(async () => {
    const me = await requireAdmin();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return fail("การอัปโหลดไฟล์ล้มเหลว");
    if (file.size > MAX_UPLOAD_BYTES) return fail("ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)");

    let data: { group?: Row[]; gif_main?: Row[]; gif?: Row[]; user?: Row[]; gif_sub?: Row[]; user_sub?: Row[] };
    try {
      data = JSON.parse(await file.text());
    } catch {
      return fail("รูปแบบไฟล์ไม่ถูกต้อง");
    }
    const gifts = data.gif_main ?? data.gif;
    if (!Array.isArray(data.group) || !Array.isArray(gifts) || !Array.isArray(data.user)) return fail("รูปแบบไฟล์ไม่ถูกต้อง");
    const hasSub = Array.isArray(data.gif_sub) && Array.isArray(data.user_sub);

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("DELETE FROM user");
      await conn.query("DELETE FROM gif_main");
      await conn.query("DELETE FROM `group`");
      if (data.group.length)
        await conn.query("INSERT INTO `group` (id, datagroup, giftname) VALUES ?", [data.group.map((r) => [r.id, r.datagroup, r.giftname ?? ""])]);
      if (gifts.length)
        await conn.query("INSERT INTO gif_main (id, giftname, datagroup) VALUES ?", [gifts.map((r) => [r.id, r.giftname, r.datagroup])]);
      if (data.user.length)
        await conn.query("INSERT INTO user (id, name, giftname, groupId, dateCreate) VALUES ?", [
          data.user.map((r) => [r.id, r.name, r.giftname ?? "", r.groupId, r.dateCreate ?? now]),
        ]);
      if (hasSub) {
        await conn.query("DELETE FROM user_sub");
        await conn.query("DELETE FROM gif_sub");
        // Old backups have no set on sub prizes → set 1. Make sure every referenced set exists.
        const known = new Set(data.group.map((r) => Number(r.datagroup)));
        const missing = [...new Set(data.gif_sub!.map((r) => Number(r.datagroup ?? 1)))].filter((dg) => !known.has(dg));
        if (missing.length) await conn.query("INSERT INTO `group` (datagroup) VALUES ?", [missing.map((dg) => [dg])]);
        if (data.gif_sub!.length)
          await conn.query("INSERT INTO gif_sub (id, giftname, datagroup) VALUES ?", [data.gif_sub!.map((r) => [r.id, r.giftname, r.datagroup ?? 1])]);
        if (data.user_sub!.length)
          await conn.query("INSERT INTO user_sub (id, name, giftname, groupId, dateCreate) VALUES ?", [
            data.user_sub!.map((r) => [r.id, r.name, r.giftname ?? "", r.groupId, r.dateCreate ?? now]),
          ]);
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      console.error(err);
      return fail("กู้คืนไม่สำเร็จ ข้อมูลเดิมไม่ถูกเปลี่ยนแปลง");
    } finally {
      conn.release();
    }

    const summary = `กลุ่ม: ${data.group.length}, รางวัล: ${gifts.length}, ผู้โชคดี: ${data.user.length}${
      hasSub ? `, รางวัลย่อย: ${data.gif_sub!.length}, ผู้โชคดี(ย่อย): ${data.user_sub!.length}` : ""
    }`;
    await logActivity(me.email, "restore_backup", summary);
    refreshAdmin();
    return { ok: true, message: `กู้คืนข้อมูลสำเร็จ! (${summary})` };
  });
}
