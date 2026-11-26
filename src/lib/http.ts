import { withBase } from "./base-path";

/** 303 redirect to an in-app path (basePath added). Relative Location so it works behind proxies. */
export function redirectInApp(path: string): Response {
  return new Response(null, { status: 303, headers: { Location: withBase(path), "Cache-Control": "no-store" } });
}
