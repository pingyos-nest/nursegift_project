import "server-only";
import type { RowDataPacket } from "mysql2";
import { pool } from "../db";
import { decodeEntities } from "../utils/text";

export type GiftType = "main" | "sub";

export interface Gift {
  key: string; // unique across both tables, e.g. "12_main"
  name: string;
  giftname: string;
  type: GiftType;
  datagroup: number | null;
  dateCreate: string | null;
}

interface GiftRow extends RowDataPacket {
  id: number;
  name: string;
  giftname: string;
  dateCreate: Date | string | null;
  gift_type: GiftType;
  datagroup?: number | null;
}

function toGift(row: GiftRow): Gift {
  const d = row.dateCreate ? new Date(row.dateCreate) : null;
  return {
    key: `${row.id}_${row.gift_type}`,
    name: row.name,
    giftname: decodeEntities(row.giftname),
    type: row.gift_type,
    datagroup: row.datagroup == null ? null : Number(row.datagroup),
    dateCreate: d && !isNaN(d.getTime()) ? d.toISOString() : null,
  };
}

function newestFirst(a: Gift, b: Gift) {
  return (b.dateCreate ? Date.parse(b.dateCreate) : 0) - (a.dateCreate ? Date.parse(a.dateCreate) : 0);
}

async function getSettings(): Promise<Map<string, string>> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'live_show_%'",
  );
  return new Map(rows.map((r) => [r.setting_key as string, String(r.setting_value)]));
}

/** Port of livedata/livedata.php — latest 50 awarded gifts for the live feed. */
export async function getLiveGifts(limit = 50): Promise<Gift[]> {
  let settings = new Map<string, string>();
  try {
    settings = await getSettings();
  } catch {
    // settings table missing → everything visible (same default as PHP)
  }


  const results: Gift[] = [];

  // Each set of each kind can be hidden from the Live page (admin → ตั้งค่าการแสดงผล).
  const sources = [
    { kind: "main", gift: "gif_main", winner: "user" },
    { kind: "sub", gift: "gif_sub", winner: "user_sub" },
  ] as const;
  const [groupRows] = await pool.query<RowDataPacket[]>("SELECT DISTINCT datagroup FROM `group`");

  for (const src of sources) {
    const visible = groupRows
      .map((g) => Number(g.datagroup))
      .filter((dg) => (settings.get(`live_show_${src.kind}_group_${dg}`) ?? "1") === "1");
    if (visible.length === 0) continue;

    const [rows] = await pool.query<GiftRow[]>(
      `SELECT u.id, u.name, u.giftname, u.dateCreate, g.datagroup, '${src.kind}' AS gift_type
         FROM ${src.winner} u
         JOIN ${src.gift} g ON u.groupId = g.id
        WHERE g.datagroup IN (?)
        ORDER BY u.id DESC LIMIT ?`,
      [visible, limit],
    );
    results.push(...rows.map(toGift));
  }

  return results.sort(newestFirst).slice(0, limit);
}

/** Port of livedata/search_api.php — search both prize tables by name/number. */
export async function searchGifts(keyword: string, limit = 10): Promise<Gift[]> {
  const like = `%${keyword}%`;
  const [[main], [sub]] = await Promise.all([
    pool.query<GiftRow[]>(
      "SELECT id, name, giftname, dateCreate, 'main' AS gift_type FROM `user` WHERE name LIKE ? ORDER BY id DESC LIMIT ?",
      [like, limit],
    ),
    pool.query<GiftRow[]>(
      "SELECT id, name, giftname, dateCreate, 'sub' AS gift_type FROM `user_sub` WHERE name LIKE ? ORDER BY id DESC LIMIT ?",
      [like, limit],
    ),
  ]);
  return [...main, ...sub].map(toGift).sort(newestFirst).slice(0, limit);
}

export const MIN_SEARCH_LENGTH = 4;
