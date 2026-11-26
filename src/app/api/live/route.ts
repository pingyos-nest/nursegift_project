import { connection } from "next/server";
import { getLiveGifts, type Gift } from "@/lib/data/public";

/**
 * Every attendee's phone polls this every 2s. Share one DB read across all of them:
 * results are reused for TTL_MS and concurrent requests wait on the same query.
 */
const TTL_MS = 1500;
let cached: { at: number; gifts: Gift[] } | null = null;
let inflight: Promise<Gift[]> | null = null;

async function liveGifts(): Promise<Gift[]> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.gifts;
  inflight ??= getLiveGifts()
    .then((gifts) => {
      cached = { at: Date.now(), gifts };
      return gifts;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export async function GET() {
  await connection(); // always runs at request time, never prerendered
  try {
    const gifts = await liveGifts();
    return Response.json({ ok: true, gifts }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("Database error in /api/live:", err);
    return Response.json({ ok: false, gifts: [] }, { status: 500 });
  }
}
