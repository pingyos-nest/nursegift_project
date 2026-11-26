import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { pool } from "../db";
import { fallback } from "./fallback";

export const locales = ["th", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "th";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export type Dictionary = typeof fallback.th;

/**
 * Port of lang_helper.php: read the `languages` table, fall back to the
 * bundled dictionary (old lang/*.php files) for any missing key or DB error.
 */
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  "use cache";
  cacheLife("minutes");
  cacheTag("languages");

  const dict: Dictionary = { ...fallback[locale] };
  try {
    const [rows] = await pool.query(
      "SELECT lang_key, lang_value FROM languages WHERE lang_code = ?",
      [locale],
    );
    for (const row of rows as { lang_key: string; lang_value: string }[]) {
      if (row.lang_key in dict) {
        dict[row.lang_key as keyof Dictionary] = row.lang_value;
      }
    }
  } catch (err) {
    console.error("Language DB error:", err);
  }
  return dict;
}
