import "server-only";
import { headers } from "next/headers";
import { pool } from "../db";

/** Port of includes/activity_logger.php — never throws. */
export async function logActivity(email: string, action: string, description = "") {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip") ?? "";
    await pool.query(
      "INSERT INTO activity_log (user_email, action, description, ip_address) VALUES (?, ?, ?, ?)",
      [email, action, description, ip],
    );
  } catch (err) {
    console.error("Activity log error:", err);
  }
}
