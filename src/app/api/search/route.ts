import type { NextRequest } from "next/server";
import { MIN_SEARCH_LENGTH, searchGifts } from "@/lib/data/public";

export async function GET(request: NextRequest) {
  const keyword = (request.nextUrl.searchParams.get("keyword") ?? "").trim();

  if ([...keyword].length < MIN_SEARCH_LENGTH) {
    return Response.json(
      { ok: false, error: "min_length", results: [] },
      { status: 400 },
    );
  }

  try {
    const results = await searchGifts(keyword);
    return Response.json({ ok: true, results }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("Database error in /api/search:", err);
    return Response.json({ ok: false, error: "db", results: [] }, { status: 500 });
  }
}
