import { NextResponse, type NextRequest } from "next/server";

const locales = ["th", "en"];
const defaultLocale = "th";
const LANG_COOKIE = "lang";
const SESSION_COOKIE = "gift_admin"; // keep in sync with lib/auth/session.ts

// Old PHP URLs (backend/*.php) → new admin routes, so bookmarks keep working.
const LEGACY_ADMIN: Record<string, string> = {
  "index": "", "group": "/sets", "gif-group": "/sets", "group-sub": "/sets", "add-gif": "/gifts",
  "export": "/export", "users": "/users", "activity-log": "/activity", "backup": "/backup",
  "settings": "/settings", "language": "/language", "auth/login": "/login",
};

function redirectTo(request: NextRequest, pathname: string, query?: Record<string, string>) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = query ? `?${new URLSearchParams(query)}` : "";
  return NextResponse.redirect(url);
}

function legacyBackend(request: NextRequest, rest: string[]) {
  const sub = rest.join("/").replace(/\.php$/, "");
  const dg = request.nextUrl.searchParams.get("datagroup");
  if (sub === "gif-group" && dg) return redirectTo(request, `/admin/sets/${encodeURIComponent(dg)}`);
  return redirectTo(request, `/admin${LEGACY_ADMIN[sub] ?? (sub ? `/${sub}` : "")}`);
}

function admin(request: NextRequest, rest: string[]) {
  // Main and sub prizes used to have separate menus; both now live under /admin/sets.
  if (rest[0] === "groups" || rest[0] === "sub") {
    const n = rest[1] ? `/${rest[1]}` : "";
    return redirectTo(request, `/admin/sets${n}`, rest[0] === "sub" && n ? { type: "sub" } : undefined);
  }
  // Optimistic check only — every page/action re-validates the session on the server.
  const sub = rest.join("/");
  const isPublic = sub === "login" || sub.startsWith("auth/");
  if (!isPublic && !request.cookies.has(SESSION_COOKIE)) return redirectTo(request, "/admin/login");
  return NextResponse.next();
}

function site(request: NextRequest, first: string | undefined, rest: string[]) {
  // Already localized: remember the choice.
  if (first && locales.includes(first)) {
    const res = NextResponse.next();
    if (request.cookies.get(LANG_COOKIE)?.value !== first) {
      res.cookies.set(LANG_COOKIE, first, { path: request.nextUrl.basePath || "/", maxAge: 60 * 60 * 24 * 365 });
    }
    return res;
  }

  // Pick locale: ?lang= (old links) → cookie → default.
  const queryLang = request.nextUrl.searchParams.get("lang");
  const cookieLang = request.cookies.get(LANG_COOKIE)?.value;
  const locale =
    (queryLang && locales.includes(queryLang) && queryLang) ||
    (cookieLang && locales.includes(cookieLang) && cookieLang) ||
    defaultLocale;

  // Legacy public URLs: /index, /livedata, /livedata/{th|en}/live, /livedata/search.php …
  let segments = first === "livedata" ? rest : [first, ...rest].filter(Boolean);
  const legacyLocale = segments[0] && locales.includes(segments[0]) ? segments[0] : locale;
  if (segments[0] && locales.includes(segments[0])) segments = segments.slice(1);
  const page = (segments[0] ?? "").replace(/\.php$/, "");
  const target = page === "live" || page === "search" ? `/${page}` : "";
  return redirectTo(request, `/${legacyLocale}${target}`);
}

export function proxy(request: NextRequest) {
  const [first, ...rest] = request.nextUrl.pathname.split("/").filter(Boolean);
  if (first === "admin") return admin(request, rest);
  if (first === "backend") return legacyBackend(request, rest);
  return site(request, first, rest);
}

export const config = {
  // Skip API routes, Next internals and static files (but catch legacy *.php URLs).
  matcher: ["/((?!api|_next|.*\\..*).*)", "/:path*.php", "/livedata/:path*", "/backend/:path*"],
};
