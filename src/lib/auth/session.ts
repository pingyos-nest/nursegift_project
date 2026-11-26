import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { getIronSession, type SessionOptions } from "iron-session";
import { BASE_PATH } from "../base-path";

export type Role = "admin" | "user";

export interface SessionUser {
  email: string;
  nameTh: string;
  nameEn: string;
  organization: string;
  role: Role;
  loginTime: string;
  isDevMode?: boolean;
}

export interface SessionData {
  user?: SessionUser;
  oauthState?: string;
}

export const SESSION_COOKIE = "gift_admin";

export const sessionOptions: SessionOptions = {
  cookieName: SESSION_COOKIE,
  password: process.env.SESSION_SECRET ?? "",
  ttl: 60 * 60 * 12, // 12h
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: BASE_PATH || "/",
  },
};

export async function getSession() {
  // iron-session checks expiry with Date.now(); keep session reads at request time.
  await connection();
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
