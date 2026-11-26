import { redirectInApp } from "@/lib/http";
import { getSession } from "@/lib/auth/session";

export async function POST() {
  const session = await getSession();
  session.destroy();
  return redirectInApp("/admin/login");
}
