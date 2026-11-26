import "server-only";
import { withBase } from "../base-path";

const tenant = () => process.env.CMU_TENANT_ID ?? "";
export const SCOPE = "api://cmu/Mis.Account.Read.Me.Basicinfo";
const BASICINFO_URL = "https://api.cmu.ac.th/mis/cmuaccount/prod/v3/me/basicinfo";

/**
 * Must exactly match a Redirect URI registered on the Azure app.
 * Production: set OAUTH_REDIRECT_URI=https://service.nurse.cmu.ac.th/dev/nursegift/admin/auth/callback
 * (behind Traefik the request origin may be the internal container address).
 */
export function redirectUri(origin: string) {
  return process.env.OAUTH_REDIRECT_URI || `${origin}${withBase("/admin/auth/callback")}`;
}

export function authorizeUrl(origin: string, state: string) {
  const q = new URLSearchParams({
    client_id: process.env.CMU_CLIENT_ID ?? "",
    response_type: "code",
    redirect_uri: redirectUri(origin),
    response_mode: "query",
    scope: SCOPE,
    state,
  });
  return `https://login.microsoftonline.com/${tenant()}/oauth2/v2.0/authorize?${q}`;
}

export async function exchangeCode(code: string, origin: string): Promise<string | null> {
  const res = await fetch(`https://login.microsoftonline.com/${tenant()}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.CMU_CLIENT_ID ?? "",
      client_secret: process.env.CMU_CLIENT_SECRET ?? "",
      code,
      redirect_uri: redirectUri(origin),
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string };
  return json.access_token ?? null;
}

export interface CmuBasicInfo {
  cmuitaccount: string;
  firstname_TH?: string;
  lastname_TH?: string;
  firstname_EN?: string;
  lastname_EN?: string;
  organization_name_TH?: string;
}

export async function fetchBasicInfo(token: string): Promise<CmuBasicInfo | null> {
  const res = await fetch(BASICINFO_URL, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as CmuBasicInfo;
  return json?.cmuitaccount ? json : null;
}
