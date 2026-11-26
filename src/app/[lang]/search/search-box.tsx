"use client";

import { useEffect, useRef, useState } from "react";
import { Gift as GiftIcon, Info, Loader2, PartyPopper, Search, SearchX, TriangleAlert, X } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { Gift } from "@/lib/data/public";
import { withBase } from "@/lib/base-path";

const MIN_LENGTH = 4;
const DEBOUNCE_MS = 500;

type Result =
  | { kind: "idle" }
  | { kind: "short" }
  | { kind: "found"; items: Gift[] }
  | { kind: "none"; message: string };

export function SearchBox({ t }: { t: Dictionary }) {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  useEffect(() => {
    const q = keyword.trim();
    if (!q) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if ([...q].length < MIN_LENGTH) {
        setResult({ kind: "short" });
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(withBase(`/api/search?keyword=${encodeURIComponent(q)}`), { signal: controller.signal });
        const data = (await res.json()) as { ok: boolean; results: Gift[] };
        if (!data.ok) setResult({ kind: "none", message: t.search_error_generic });
        else if (data.results.length) setResult({ kind: "found", items: data.results });
        else setResult({ kind: "none", message: t.search_result_notfound_title });
      } catch (err) {
        if ((err as Error).name !== "AbortError") setResult({ kind: "none", message: t.search_error_connection });
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [keyword, t]);

  return (
    <section className="mx-auto max-w-xl px-4 pb-16">
      <form role="search" onSubmit={(e) => e.preventDefault()} className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-stone-400" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            if (!e.target.value.trim()) {
              setResult({ kind: "idle" });
              setLoading(false);
            }
          }}
          placeholder={t.search_placeholder}
          aria-label={t.search_button}
          autoComplete="off"
          className="w-full rounded-2xl border border-stone-300 bg-white py-4 pl-12 pr-12 text-lg shadow-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 [&::-webkit-search-cancel-button]:hidden"
        />
        {loading ? (
          <Loader2 className="absolute right-4 top-1/2 size-5 -translate-y-1/2 animate-spin text-brand-500" aria-hidden />
        ) : keyword && (
          <button
            type="button"
            aria-label="ล้าง"
            onClick={() => { setKeyword(""); setResult({ kind: "idle" }); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="size-4" />
          </button>
        )}
      </form>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-sm text-stone-500"><Info className="size-4 shrink-0" aria-hidden />{t.search_tips_desc}</p>

      <div className="mt-6" aria-live="polite">
        {result.kind === "short" && (
          <p className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-center text-amber-800"><TriangleAlert className="size-4 shrink-0" aria-hidden />{t.search_warning_min_chars}</p>
        )}
        {result.kind === "none" && (
          <div className="rounded-xl border border-stone-200 bg-white px-4 py-8 text-center text-stone-600">
            <SearchX className="mx-auto mb-2 size-10 text-stone-300" aria-hidden />
            {result.message}
          </div>
        )}
        {result.kind === "found" && (
          <div className="space-y-3">
            <h2 className="flex items-center justify-center gap-2 text-center text-lg font-semibold text-brand-600">
              <PartyPopper className="size-5" aria-hidden /> {t.search_result_success_title}
              {result.items.length > 1 && ` (${result.items.length})`}
            </h2>
            {result.items.map((g) => (
              <article key={g.key} className="animate-card-in rounded-2xl border border-brand-100 bg-white p-5 text-center shadow-sm">
                <p className="text-xl font-semibold break-words">{g.name}</p>
                <p className="mt-1 flex items-center justify-center gap-1.5 text-brand-700 break-words"><GiftIcon className="size-4 shrink-0" aria-hidden />{g.giftname}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
