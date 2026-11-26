import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getExportRows } from "@/lib/data/admin";
import { formatDate } from "@/lib/utils/text";

const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** CSV export (was client-side table scraping in export.php). */
export async function GET(request: NextRequest) {
  if (!(await getSession()).user) return new Response("Unauthorized", { status: 401 });
  const sp = request.nextUrl.searchParams;
  const kind = sp.get("tab") === "sub" ? "sub" : "main";
  const dgParam = sp.get("datagroup");
  const dg = dgParam && dgParam !== "all" && Number(dgParam) > 0 ? Number(dgParam) : "all";

  const rows = await getExportRows(kind, dg);
  const header = ["#", "ชื่อผู้โชคดี", "ของรางวัล", "ชุดที่", "วันที่"];
  const lines = [header.map(cell).join(",")];
  rows.forEach((r, i) => {
    const cols = [i + 1, r.name, r.giftname || "-", r.datagroup ?? "-", formatDate(r.dateCreate)];
    lines.push(cols.map(cell).join(","));
  });

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" }).replace(/-/g, "");
  const name = `winners_${kind}_${dg}_${today}.csv`;
  return new Response("﻿" + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
