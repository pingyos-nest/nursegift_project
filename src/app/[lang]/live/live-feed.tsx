"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  AlertTriangle, Gift as GiftIcon, Loader2, RefreshCw, Sparkles, Trophy, Wifi, WifiOff, type LucideIcon,
} from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { Gift } from "@/lib/data/public";
import { stripLeadingEmoji } from "@/lib/utils/text";
import { withBase } from "@/lib/base-path";

const POLL_MS = 2000;
const RETRY_DELAY_MS = 5000;
const MAX_RETRIES = 3;
const FRESH_MS = 15000; // how long a newly drawn winner keeps its "NEW" highlight

type Status = "loading" | "online" | "reconnecting" | "offline";

// ---- small external stores (no setState-in-effect) ----
// Coarse clock (5s steps) so "NEW" badges expire and "x minutes ago" stays current.
function subscribeClock(cb: () => void) {
  const id = setInterval(cb, 5000);
  return () => clearInterval(id);
}
const clockSnapshot = () => Math.floor(Date.now() / 5000) * 5000;


export function LiveFeed({ t, lang }: { t: Dictionary; lang: Locale }) {
  const [gifts, setGifts] = useState<Gift[] | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [freshUntil, setFreshUntil] = useState<Map<string, number>>(new Map());
  const seen = useRef<Set<string>>(new Set());
  const failures = useRef(0);
  const lastJson = useRef("");

  const now = useSyncExternalStore(subscribeClock, clockSnapshot, () => 0);

  const load = useCallback(async () => {
    try {
      const res = await fetch(withBase("/api/live"), { cache: "no-store", signal: AbortSignal.timeout(10000) });
      const data = (await res.json()) as { ok: boolean; gifts: Gift[] };
      if (!res.ok || !data.ok) throw new Error("bad response");
      failures.current = 0;
      setStatus("online");

      const json = JSON.stringify(data.gifts);
      if (json === lastJson.current) return;
      lastJson.current = json;

      const isFirst = seen.current.size === 0; // don't flag everything as NEW on page load
      const added = data.gifts.filter((g) => !seen.current.has(g.key)).map((g) => g.key);
      data.gifts.forEach((g) => seen.current.add(g.key));
      if (!isFirst && added.length) {
        const until = Date.now() + FRESH_MS;
        setFreshUntil((m) => new Map([...m, ...added.map((k) => [k, until] as const)]));
      }
      setGifts(data.gifts);
    } catch {
      failures.current += 1;
      setStatus(failures.current >= MAX_RETRIES ? "offline" : "reconnecting");
    }
  }, []);

  // Poll while the tab is visible; back off after repeated failures.
  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; }, [load]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const run = async () => {
      if (stopped || document.hidden) return;
      await loadRef.current();
      if (stopped) return;
      const delay = failures.current >= MAX_RETRIES ? RETRY_DELAY_MS : POLL_MS;
      if (failures.current >= MAX_RETRIES) failures.current = 0;
      timer = setTimeout(run, delay);
    };
    const onVisibility = () => { clearTimeout(timer); if (!document.hidden) run(); };
    run();
    document.addEventListener("visibilitychange", onVisibility);
    return () => { stopped = true; clearTimeout(timer); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  const isFresh = (key: string) => (freshUntil.get(key) ?? 0) > now;

  const shown = gifts ?? [];

  const rtf = useMemo(() => new Intl.RelativeTimeFormat(lang === "th" ? "th-TH" : "en", { numeric: "auto" }), [lang]);
  const ago = (iso: string | null) => {
    if (!iso || !now) return "";
    const mins = Math.round((Date.parse(iso) - now) / 60000);
    if (mins > -1) return rtf.format(0, "minute");
    if (mins > -60) return rtf.format(mins, "minute");
    const hrs = Math.round(mins / 60);
    return hrs > -24 ? rtf.format(hrs, "hour") : rtf.format(Math.round(hrs / 24), "day");
  };


  const statusMeta: Record<Status, { icon: LucideIcon; text: string; cls: string }> = {
    loading: { icon: Loader2, text: "", cls: "text-stone-400" },
    online: { icon: Wifi, text: stripLeadingEmoji(t.live_status_connected), cls: "text-green-600" },
    reconnecting: { icon: Loader2, text: stripLeadingEmoji(t.live_status_reconnecting), cls: "text-amber-600" },
    offline: { icon: WifiOff, text: stripLeadingEmoji(t.live_status_disconnected), cls: "text-red-600" },
  };
  const S = statusMeta[status];


  return (
    <section className="mx-auto max-w-6xl px-4 pb-16">
      {/* Connection status: shown while there is something to report (as before) */}
      {status !== "loading" && status !== "online" && (
        <div role="status" className={`fixed right-4 top-20 z-30 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium shadow-lg ring-1 ring-stone-200 ${S.cls}`}>
          <S.icon className={`size-4 ${status === "reconnecting" ? "animate-spin" : ""}`} aria-hidden />
          {S.text}
        </div>
      )}

      {status === "offline" && !gifts?.length ? (
        <StateCard icon={AlertTriangle} tone="text-red-500" title={t.live_error_title} desc={t.live_error_desc}>
          <button onClick={() => location.reload()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2 font-medium text-white hover:bg-brand-600">
            <RefreshCw className="size-4" aria-hidden /> {t.live_retry}
          </button>
        </StateCard>
      ) : gifts === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-stone-200/70" />)}
        </div>
      ) : shown.length === 0 ? (
        <StateCard icon={GiftIcon} tone="text-brand-500" title={t.live_empty_title} desc={t.live_empty_desc} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((g, i) => {
            const fresh = isFresh(g.key);
            const main = g.type === "main";
            return (
              <article
                key={g.key}
                style={{ animationDelay: `${Math.min(i * 60, 1500)}ms` }}
                className={`relative animate-card-in overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:shadow-md ${fresh ? "animate-glow" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <KindPill gift={g} label={main ? t.live_main : t.live_sub} setLabel={t.live_set} />
                  {fresh && (
                    <span className="flex items-center gap-1 rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-bold text-white">
                      <Sparkles className="size-3" aria-hidden /> {t.live_new_badge}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-2xl font-bold tracking-tight break-words">{g.name}</h3>
                <p className={`mt-1 flex items-start gap-1.5 break-words ${main ? "text-brand-700" : "text-sky-700"}`}>
                  {main ? <Trophy className="mt-1 size-4 shrink-0" aria-hidden /> : <GiftIcon className="mt-1 size-4 shrink-0" aria-hidden />}
                  {g.giftname}
                </p>
                {g.dateCreate && <p className="mt-3 text-xs text-stone-400">{ago(g.dateCreate)}</p>}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function KindPill({ gift, label, setLabel, light }: { gift: Gift; label: string; setLabel: string; light?: boolean }) {
  const Icon = gift.type === "main" ? Trophy : GiftIcon;
  const cls = light
    ? "bg-white/20 text-white backdrop-blur"
    : gift.type === "main" ? "bg-brand-50 text-brand-700" : "bg-sky-50 text-sky-700";
  return (
    <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      <Icon className="size-3.5" aria-hidden /> {label}
      {gift.datagroup != null && <span className="opacity-80">· {setLabel} {gift.datagroup}</span>}
    </span>
  );
}

function StateCard({ icon: Icon, tone, title, desc, children }: { icon: LucideIcon; tone: string; title: string; desc: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-white p-10 text-center">
      <Icon className={`mx-auto size-12 ${tone}`} aria-hidden />
      <h3 className="mt-3 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-stone-600">{desc}</p>
      {children}
    </div>
  );
}
