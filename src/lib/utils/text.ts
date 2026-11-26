/**
 * The PHP importer stored names with htmlspecialchars() applied, so old rows can
 * contain "&amp;" etc. React escapes output itself, so decode before display.
 */
export function decodeEntities(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, "&");
}

export function formatDate(iso: string | null, withSeconds = false): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", ...(withSeconds ? { second: "2-digit" } : {}),
    hour12: false, timeZone: "Asia/Bangkok",
  });
}

export function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/** Remove leading emoji/symbols from translated strings (icons are rendered separately). */
export function stripLeadingEmoji(value: string): string {
  return value.replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, "");
}
