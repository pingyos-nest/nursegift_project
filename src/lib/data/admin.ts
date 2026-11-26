import "server-only";
import type { RowDataPacket } from "mysql2";
import { pool } from "../db";
import { decodeEntities, toIso } from "../utils/text";

export type Kind = "main" | "sub";

/** A prize set ("ชุดที่ N", table `group`) holds both main and sub prizes. */
export const TABLES = {
  main: { gift: "gif_main", winner: "user" },
  sub: { gift: "gif_sub", winner: "user_sub" },
} as const;

export const KIND_LABEL = { main: "รางวัลใหญ่", sub: "รางวัลย่อย" } as const;

async function count(sql: string, params: unknown[] = []): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(sql, params);
  return Number(rows[0]?.total ?? 0);
}

// ---------- Dashboard (index.php) ----------

export interface RecentWinner {
  name: string;
  giftname: string;
  dateCreate: string | null;
  type: Kind;
  datagroup: number | null;
}

export async function getDashboard() {
  const [mainGifts, subGifts, mainWinners, subWinners, groups] = await Promise.all([
    count("SELECT COUNT(*) AS total FROM gif_main"),
    count("SELECT COUNT(*) AS total FROM gif_sub"),
    count("SELECT COUNT(*) AS total FROM user"),
    count("SELECT COUNT(*) AS total FROM user_sub"),
    count("SELECT COUNT(*) AS total FROM `group`"),
  ]);
  const [recent] = await pool.query<RowDataPacket[]>(`
    (SELECT u.name, u.giftname, u.dateCreate, 'main' AS type, g.datagroup
       FROM user u LEFT JOIN gif_main g ON u.groupId = g.id ORDER BY u.id DESC LIMIT 5)
    UNION ALL
    (SELECT us.name, us.giftname, us.dateCreate, 'sub' AS type, gs.datagroup
       FROM user_sub us LEFT JOIN gif_sub gs ON us.groupId = gs.id ORDER BY us.id DESC LIMIT 5)
    ORDER BY dateCreate DESC LIMIT 8`);
  return {
    mainGifts, subGifts, mainWinners, subWinners, groups,
    recent: recent.map((r) => ({
      name: r.name,
      giftname: decodeEntities(r.giftname),
      dateCreate: toIso(r.dateCreate),
      type: r.type,
      datagroup: r.datagroup,
    })) as RecentWinner[],
  };
}

// ---------- Groups ----------

export async function getGroups(): Promise<number[]> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT DISTINCT datagroup FROM `group` ORDER BY datagroup ASC");
  return rows.map((r) => Number(r.datagroup));
}

export interface SetSummary {
  datagroup: number;
  main: { gifts: number; claimed: number };
  sub: { gifts: number; claimed: number };
}

/** Every set with prize / claimed counts for both kinds (for the set picker cards). */
export async function getSetSummaries(): Promise<SetSummary[]> {
  const per = async (kind: Kind) => {
    const t = TABLES[kind];
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT g.datagroup, COUNT(DISTINCT g.id) AS gifts, COUNT(DISTINCT CASE WHEN u.id IS NOT NULL THEN g.id END) AS claimed
         FROM ${t.gift} g LEFT JOIN ${t.winner} u ON u.groupId = g.id
        GROUP BY g.datagroup`,
    );
    return new Map(rows.map((r) => [Number(r.datagroup), { gifts: Number(r.gifts), claimed: Number(r.claimed) }]));
  };
  const [sets, main, sub] = await Promise.all([getGroups(), per("main"), per("sub")]);
  const zero = { gifts: 0, claimed: 0 };
  return sets.map((dg) => ({ datagroup: dg, main: main.get(dg) ?? zero, sub: sub.get(dg) ?? zero }));
}

// ---------- Drawing pages (gif-group.php / group-sub.php) ----------

export interface GiftWithCount {
  id: number;
  giftname: string;
  userCount: number;
}

export interface GiftStats {
  gifts: number;
  empty: number;
  claimed: number;
  winners: number;
}

/** Gifts with how many winners each has; empty gifts first (same order as PHP). */
export async function getGiftsWithCounts(kind: Kind, datagroup: number): Promise<GiftWithCount[]> {
  const t = TABLES[kind];
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT g.id, g.giftname, COUNT(u.id) AS userCount
       FROM ${t.gift} g LEFT JOIN ${t.winner} u ON g.id = u.groupId
      WHERE g.datagroup = ?
      GROUP BY g.id
      ORDER BY (COUNT(u.id) > 0) ASC, g.id ASC`,
    [datagroup],
  );
  return rows.map((r) => ({ id: r.id, giftname: decodeEntities(r.giftname), userCount: Number(r.userCount) }));
}

export async function getGiftStats(kind: Kind, datagroup: number): Promise<GiftStats> {
  const t = TABLES[kind];
  const where = "WHERE g.datagroup = ?";
  const p = [datagroup];
  const [gifts, claimed, winners] = await Promise.all([
    count(`SELECT COUNT(*) AS total FROM ${t.gift} g ${where}`, p),
    count(`SELECT COUNT(DISTINCT g.id) AS total FROM ${t.gift} g INNER JOIN ${t.winner} u ON g.id = u.groupId ${where}`, p),
    count(`SELECT COUNT(*) AS total FROM ${t.winner} u INNER JOIN ${t.gift} g ON u.groupId = g.id ${where}`, p),
  ]);
  return { gifts, claimed, empty: gifts - claimed, winners };
}

export interface WinnerRecord {
  id: number;
  name: string;
  giftname: string;
  dateCreate: string | null;
}

export async function getWinnersForGift(kind: Kind, giftId: number): Promise<WinnerRecord[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, giftname, dateCreate FROM ${TABLES[kind].winner} WHERE groupId = ? ORDER BY dateCreate DESC`,
    [giftId],
  );
  return rows.map((r) => ({ id: r.id, name: r.name, giftname: decodeEntities(r.giftname), dateCreate: toIso(r.dateCreate) }));
}

// ---------- Settings ----------

export async function getSettings(): Promise<Map<string, string>> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT setting_key, setting_value FROM settings");
    return new Map(rows.map((r) => [String(r.setting_key), String(r.setting_value ?? "")]));
  } catch {
    return new Map();
  }
}

export const liveKey = (kind: Kind, datagroup: number) => `live_show_${kind}_group_${datagroup}`;

export async function isLiveVisible(kind: Kind, datagroup: number) {
  return ((await getSettings()).get(liveKey(kind, datagroup)) ?? "1") === "1";
}

// ---------- Gift management (add-gif.php) ----------

export interface GiftRow {
  id: number;
  giftname: string;
  datagroup: number | null;
}

export async function getAllGifts(kind: Kind): Promise<GiftRow[]> {
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT id, giftname, datagroup FROM ${TABLES[kind].gift} ORDER BY datagroup ASC, id DESC`);
  return rows.map((r) => ({ id: r.id, giftname: decodeEntities(r.giftname), datagroup: r.datagroup == null ? null : Number(r.datagroup) }));
}

// ---------- Export (export.php) ----------

export interface ExportRow {
  name: string;
  giftname: string;
  datagroup: number | null;
  dateCreate: string | null;
}

export async function getExportRows(kind: Kind, datagroup: number | "all" = "all"): Promise<ExportRow[]> {
  const t = TABLES[kind];
  const filter = datagroup === "all" ? "" : "WHERE g.datagroup = ?";
  const order = datagroup === "all" ? "g.datagroup ASC, u.dateCreate DESC" : "u.dateCreate DESC";
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.name, COALESCE(NULLIF(g.giftname, ''), u.giftname) AS giftname, g.datagroup, u.dateCreate
       FROM ${t.winner} u LEFT JOIN ${t.gift} g ON u.groupId = g.id ${filter} ORDER BY ${order}`,
    datagroup === "all" ? [] : [datagroup],
  );
  return rows.map((r) => ({
    name: r.name,
    giftname: decodeEntities(r.giftname),
    datagroup: r.datagroup == null ? null : Number(r.datagroup),
    dateCreate: toIso(r.dateCreate),
  }));
}

export async function countWinners(kind: Kind) {
  return count(`SELECT COUNT(*) AS total FROM ${TABLES[kind].winner}`);
}

// ---------- Users (users.php) ----------

export interface AdminUser {
  id: number;
  email: string;
  name: string | null;
  role: "admin" | "user";
  status: boolean;
  createdAt: string | null;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM backend_users ORDER BY created_at DESC");
  return rows.map((r) => ({
    id: r.id, email: r.email, name: r.name, role: r.role === "admin" ? "admin" : "user",
    status: Boolean(r.status), createdAt: toIso(r.created_at),
  }));
}

// ---------- Activity log (activity-log.php) ----------

export const ACTIVITY_PER_PAGE = 50;

export async function getActivity(opts: { page: number; action?: string; user?: string }) {
  const where: string[] = ["1=1"];
  const params: unknown[] = [];
  if (opts.action) { where.push("action = ?"); params.push(opts.action); }
  if (opts.user) { where.push("user_email LIKE ?"); params.push(`%${opts.user}%`); }
  const w = where.join(" AND ");

  const total = await count(`SELECT COUNT(*) AS total FROM activity_log WHERE ${w}`, params);
  const offset = (opts.page - 1) * ACTIVITY_PER_PAGE;
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM activity_log WHERE ${w} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, ACTIVITY_PER_PAGE, offset],
  );
  const [actions] = await pool.query<RowDataPacket[]>("SELECT DISTINCT action FROM activity_log ORDER BY action");
  return {
    total,
    rows: rows.map((r) => ({
      id: r.id as number, email: r.user_email as string, action: r.action as string,
      description: (r.description as string) ?? "", ip: (r.ip_address as string) ?? "", createdAt: toIso(r.created_at),
    })),
    actions: actions.map((a) => String(a.action)),
  };
}

// ---------- Languages (language.php) ----------

export async function getLanguageRows(code: "th" | "en"): Promise<Record<string, string>> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT lang_key, lang_value FROM languages WHERE lang_code = ?", [code]);
  return Object.fromEntries(rows.map((r) => [r.lang_key, r.lang_value]));
}

// ---------- Backup (backup.php) ----------

export async function getBackupCounts() {
  const [groups, gifts, winners, subGifts, subWinners] = await Promise.all([
    count("SELECT COUNT(*) AS total FROM `group`"),
    count("SELECT COUNT(*) AS total FROM gif_main"),
    count("SELECT COUNT(*) AS total FROM user"),
    count("SELECT COUNT(*) AS total FROM gif_sub"),
    count("SELECT COUNT(*) AS total FROM user_sub"),
  ]);
  return { groups, gifts, winners, subGifts, subWinners };
}
