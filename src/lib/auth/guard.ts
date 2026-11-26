import "server-only";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";
import { pool } from "../db";
import { getSession, type SessionUser } from "./session";

/** Port of auth/check.php. Also re-checks backend_users so disabled users are kicked out. */
export async function getCurrentUser(): Promise<SessionUser> {
  const session = await getSession();
  const user = session.user;
  if (!user) redirect("/admin/login");

  if (!user.isDevMode) {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT role FROM backend_users WHERE email = ? AND status = 1",
      [user.email],
    );
    if (rows.length === 0) {
      session.destroy();
      redirect("/admin/login?error=forbidden");
    }
    user.role = rows[0].role === "admin" ? "admin" : "user";
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (user.role !== "admin") redirect("/admin");
  return user;
}

export const isDevLoginEnabled = () =>
  process.env.NODE_ENV !== "production" && process.env.DEV_LOGIN === "true";
