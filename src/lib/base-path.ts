/**
 * The app is served under a sub-path (Dokploy: https://service.nurse.cmu.ac.th/dev/nursegift).
 * <Link>, router.push and redirect() in pages/actions add it automatically; everything else
 * (fetch, <img>/<Image> src, plain <a>/<form action>, Location headers, cookie paths) must use withBase().
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBase(path: string): string {
  return `${BASE_PATH}${path}`;
}
