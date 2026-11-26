import type { RowDataPacket } from "mysql2";
import type { NextRequest } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { exchangeCode, fetchBasicInfo } from "@/lib/auth/cmu-oauth";
import { logActivity } from "@/lib/data/activity";
import { redirectInApp } from "@/lib/http";

const fail = (code: string) => redirectInApp(`/admin/login?error=${code}`);

/** Port of PHP backend/auth/callback.php */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const session = await getSession();
  const expectedState = session.oauthState;
  session.oauthState = undefined;
  await session.save();

  if (params.get("error")) return fail("oauth");
  const code = params.get("code");
  if (!code || !expectedState || params.get("state") !== expectedState) return fail("state");

  const token = await exchangeCode(code, request.nextUrl.origin);
  if (!token) return fail("token");
  const info = await fetchBasicInfo(token);
  if (!info) return fail("profile");

  const email = info.cmuitaccount;
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT role FROM backend_users WHERE email = ? AND status = 1",
    [email],
  );
  if (!rows.length) return fail("forbidden");

  session.user = {
    email,
    nameTh: `${info.firstname_TH ?? ""} ${info.lastname_TH ?? ""}`.trim(),
    nameEn: `${info.firstname_EN ?? ""} ${info.lastname_EN ?? ""}`.trim(),
    organization: info.organization_name_TH ?? "",
    role: rows[0].role === "admin" ? "admin" : "user",
    loginTime: new Date().toISOString(),
  };
  await session.save();
  await logActivity(email, "login", "เข้าสู่ระบบ");
  return redirectInApp("/admin");
}
