import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronRight, CircleDashed, Gift, Layers, Trophy, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/guard";
import { getGiftStats, getGiftsWithCounts, getSetSummaries, isLiveVisible, KIND_LABEL, type Kind } from "@/lib/data/admin";
import { Empty, PageHeader, Stat, StatGrid } from "./layout-bits";
import { GiftBoard } from "./gift-board";
import { AddGroupButton, DeleteGroupButton } from "./group-buttons";

export const SETS_PATH = "/admin/sets";

function Progress({ label, icon: Icon, claimed, gifts, bar, text }: { label: string; icon: typeof Trophy; claimed: number; gifts: number; bar: string; text: string }) {
  const pct = gifts ? Math.round((claimed / gifts) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className={`flex items-center gap-1.5 font-medium ${text}`}><Icon className="size-4" aria-hidden />{label}</span>
        <span className="tabular-nums text-stone-500">{claimed.toLocaleString()} / {gifts.toLocaleString()}</span>
      </div>
      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-stone-100" aria-hidden>
        <span className={`block h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}

/** Set picker: every set holds รางวัลใหญ่ + รางวัลย่อย. */
export async function PrizeSetList() {
  await getCurrentUser();
  const sets = await getSetSummaries();
  const next = (sets.at(-1)?.datagroup ?? 0) + 1;

  return (
    <>
      <PageHeader title="ชุดรางวัล" subtitle="แต่ละชุดประกอบด้วยรางวัลใหญ่และรางวัลย่อย — เลือกชุดเพื่อบันทึกผู้โชคดี" actions={<AddGroupButton next={next} />} />
      {sets.length === 0 ? (
        <Empty title="ยังไม่มีชุดรางวัล" desc="กด “เพิ่มชุดรางวัล” หรือนำเข้าไฟล์ Excel ในหน้าจัดการรางวัล" icon={Layers}>
          <Link href="/admin/gifts" className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium hover:bg-stone-50">
            ไปหน้าจัดการรางวัล <ChevronRight className="size-4" aria-hidden />
          </Link>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sets.map((set) => (
            <div key={set.datagroup} className="relative">
              <Link
                href={`${SETS_PATH}/${set.datagroup}`}
                className="flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md"
              >
                <span className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Layers className="size-6" aria-hidden /></span>
                  <span className="text-xl font-bold">ชุดที่ {set.datagroup}</span>
                </span>
                <span className="mt-4 space-y-3">
                  <Progress label="รางวัลใหญ่" icon={Trophy} {...set.main} bar="bg-brand-500" text="text-brand-700" />
                  <Progress label="รางวัลย่อย" icon={Gift} {...set.sub} bar="bg-sky-500" text="text-sky-700" />
                </span>
                <span className="mt-4 flex items-center gap-0.5 text-sm font-medium text-stone-600">
                  บันทึกผู้โชคดี <ChevronRight className="size-4" aria-hidden />
                </span>
              </Link>
              <DeleteGroupButton datagroup={set.datagroup} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/** One set: tabs for รางวัลใหญ่ / รางวัลย่อย, each with its own drawing board. */
export async function PrizeSetBoard({ params, searchParams }: { params: Promise<{ datagroup: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await getCurrentUser();
  const dg = Number((await params).datagroup);
  if (!Number.isInteger(dg) || dg <= 0) notFound();
  const kind: Kind = (await searchParams).type === "sub" ? "sub" : "main";

  const [gifts, stats, live, mainStats, subStats] = await Promise.all([
    getGiftsWithCounts(kind, dg), getGiftStats(kind, dg), isLiveVisible(kind, dg), getGiftStats("main", dg), getGiftStats("sub", dg),
  ]);

  const tabs = [
    { kind: "main" as const, icon: Trophy, s: mainStats, active: "border-brand-500 text-brand-600" },
    { kind: "sub" as const, icon: Gift, s: subStats, active: "border-sky-500 text-sky-600" },
  ];

  return (
    <>
      <PageHeader
        title={`ชุดรางวัลที่ ${dg}`}
        subtitle="คลิกที่ของรางวัลเพื่อระบุผู้โชคดี"
        actions={
          <Link href={SETS_PATH} className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm hover:bg-stone-50">
            <ArrowLeft className="size-4" aria-hidden /> เลือกชุดอื่น
          </Link>
        }
      />

      <div className="mb-6 flex gap-2 border-b border-stone-200" role="tablist">
        {tabs.map((t) => (
          <Link
            key={t.kind}
            role="tab"
            aria-selected={kind === t.kind}
            href={`${SETS_PATH}/${dg}${t.kind === "sub" ? "?type=sub" : ""}`}
            scroll={false}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              kind === t.kind ? t.active : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <t.icon className="size-4" aria-hidden />
            {KIND_LABEL[t.kind]}
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium tabular-nums text-stone-600">
              {t.s.claimed}/{t.s.gifts}
            </span>
          </Link>
        ))}
      </div>

      <StatGrid>
        <Stat label={`${KIND_LABEL[kind]}ทั้งหมด`} value={stats.gifts} icon={kind === "main" ? Trophy : Gift} />
        <Stat label="ว่าง" value={stats.empty} tone="brand" icon={CircleDashed} />
        <Stat label="มีผู้รับแล้ว" value={stats.claimed} tone="green" icon={CheckCircle2} />
        <Stat label="ผู้รับรางวัล" value={stats.winners} tone="sky" icon={Users} />
      </StatGrid>
      <GiftBoard key={kind} kind={kind} datagroup={dg} gifts={gifts} liveVisible={live} />
    </>
  );
}
