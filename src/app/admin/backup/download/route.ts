import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/data/activity";

/** Port of backup.php (action=backup). Same JSON shape, plus gif_sub/user_sub. */
export async function GET() {
  const user = (await getSession()).user;
  if (user?.role !== "admin") return new Response("Forbidden", { status: 403 });

  const q = async (sql: string) => (await pool.query({ sql, dateStrings: true }))[0];
  const now = new Date();
  const stamp = now.toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" });
  const data = {
    gif_main: await q("SELECT * FROM gif_main"),
    group: await q("SELECT * FROM `group`"),
    user: await q("SELECT * FROM user"),
    gif_sub: await q("SELECT * FROM gif_sub"),
    user_sub: await q("SELECT * FROM user_sub"),
    created_at: stamp,
    created_by: user.email,
  };
  await logActivity(user.email, "backup", "ดาวน์โหลดไฟล์สำรองข้อมูล");
  const file = `backup_${stamp.replace(/[-: ]/g, "").replace(/^(\d{8})/, "$1_")}.json`;
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "no-store",
    },
  });
}
