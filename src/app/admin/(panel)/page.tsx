import { Suspense } from "react";
import PageSkeleton from "./loading";
import Link from "next/link";
import { ArrowRight, ExternalLink, FileSpreadsheet, Gift, Layers, PartyPopper, Trophy, Users, Wrench } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/guard";
import { getDashboard } from "@/lib/data/admin";
import { Card, Empty, KindBadge, Stat } from "@/components/admin/layout-bits";
import { formatDate } from "@/lib/utils/text";
import { withBase } from "@/lib/base-path";

export const metadata = { title: "หน้าหลัก" };

const QUICK = [
  { href: "/admin/sets", title: "บันทึกผู้โชคดี", desc: "เลือกชุดรางวัล (ใหญ่ + ย่อย)", icon: Trophy, tone: "bg-brand-50 text-brand-600" },
  { href: "/admin/gifts", title: "จัดการรางวัล", desc: "เพิ่ม/ลบ/แก้ไข/นำเข้า", icon: Wrench, tone: "bg-stone-100 text-stone-700" },
  { href: "/admin/export", title: "ส่งออกข้อมูล", desc: "CSV / พิมพ์", icon: FileSpreadsheet, tone: "bg-green-50 text-green-600" },
];

async function DashboardPageContent() {
  const user = await getCurrentUser(); // reads the session first → request-time render
  const d = await getDashboard();

  return (
    <>
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 p-6 text-white">
        <h1 className="text-2xl font-bold">สวัสดี, {user.nameTh || "Admin"}</h1>
        <p className="mt-1 opacity-90">ระบบจัดการของรางวัล</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="รางวัล(ใหญ่)" value={d.mainGifts} tone="brand" icon={Trophy} />
        <Stat label="ชุดรางวัล" value={d.groups} icon={Layers} />
        <Stat label="ผู้โชคดี(ใหญ่)" value={d.mainWinners} tone="green" icon={Users} />
        <Stat label="รางวัล(ย่อย)" value={d.subGifts} tone="sky" icon={Gift} />
        <Stat label="ผู้โชคดี(ย่อย)" value={d.subWinners} tone="green" icon={Users} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card title="เมนูลัด" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-3">
            {QUICK.map((q) => (
              <Link key={q.href} href={q.href} className="group rounded-xl first:col-span-2 border border-stone-200 p-4 transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-sm">
                <span className={`flex size-10 items-center justify-center rounded-lg ${q.tone}`}><q.icon className="size-5" aria-hidden /></span>
                <p className="mt-3 flex items-center gap-1 font-medium">
                  {q.title}
                  <ArrowRight className="size-4 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" aria-hidden />
                </p>
                <p className="text-sm text-stone-500">{q.desc}</p>
              </Link>
            ))}
          </div>
          <a href={withBase("/th/live")} target="_blank" className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white hover:bg-stone-700">
            <ExternalLink className="size-4" aria-hidden /> ดูหน้า Live Display
          </a>
        </Card>

        <Card title="ผู้โชคดีล่าสุด" actions={<Link href="/admin/export" className="flex items-center gap-1 text-sm text-brand-600 hover:underline">ดูทั้งหมด <ArrowRight className="size-4" aria-hidden /></Link>} className="lg:col-span-3">
          {d.recent.length === 0 ? (
            <Empty title="ยังไม่มีข้อมูลผู้โชคดี" icon={PartyPopper} />
          ) : (
            <ul className="divide-y divide-stone-100">
              {d.recent.map((w, i) => (
                <li key={i} className="flex items-center gap-3 py-3">
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${w.type === "main" ? "bg-brand-50 text-brand-600" : "bg-sky-50 text-sky-600"}`}>
                    {w.type === "main" ? <Trophy className="size-4" aria-hidden /> : <Gift className="size-4" aria-hidden />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{w.name}</p>
                    <p className="truncate text-sm text-stone-500">{w.giftname || "-"}</p>
                  </div>
                  <div className="text-right">
                    <KindBadge kind={w.type} />
                    <p className="mt-1 text-xs text-stone-400">{formatDate(w.dateCreate)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardPageContent />
    </Suspense>
  );
}
