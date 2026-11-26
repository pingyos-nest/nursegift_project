import { randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { redirect } from "next/navigation"; // external URL (Microsoft login), basePath not involved
import { getSession } from "@/lib/auth/session";
import { authorizeUrl } from "@/lib/auth/cmu-oauth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  session.oauthState = randomBytes(16).toString("hex");
  await session.save();
  redirect(authorizeUrl(request.nextUrl.origin, session.oauthState));
}
