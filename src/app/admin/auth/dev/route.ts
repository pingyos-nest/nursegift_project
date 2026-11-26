import { redirectInApp } from "@/lib/http";
import { getSession } from "@/lib/auth/session";
import { isDevLoginEnabled } from "@/lib/auth/guard";

/** Port of dev-login.php — only when NODE_ENV !== production and DEV_LOGIN=true. */
export async function POST(request: Request) {
  if (!isDevLoginEnabled()) return redirectInApp("/admin/login");
  const form = await request.formData();
  const role = form.get("role") === "user" ? "user" : "admin";
  const session = await getSession();
  session.user = {
    email: role === "admin" ? "developer@test.local" : "user@test.local",
    nameTh: role === "admin" ? "Developer Admin" : "Developer User",
    nameEn: role === "admin" ? "Developer Admin" : "Developer User",
    organization: "Development Mode",
    role,
    loginTime: new Date().toISOString(),
    isDevMode: true,
  };
  await session.save();
  return redirectInApp("/admin");
}
