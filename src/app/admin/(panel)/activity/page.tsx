import { Suspense } from "react";
import PageSkeleton from "../loading";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Filter, History, RotateCcw } from "lucide-react";
import { requireAdmin } from "@/lib/auth/guard";
import { ACTIVITY_PER_PAGE, getActivity } from "@/lib/data/admin";
import { Card, Empty, PageHeader } from "@/components/admin/layout-bits";
import { inputClass } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils/text";

export const metadata = { title: "ประวัติการใช้งาน" };

async function ActivityPageContent({ searchParams }: PageProps<"/admin/activity">) {
  await requireAdmin();
  const sp = await searchParams;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const action = str(sp.action);
  const user = str(sp.user);
  const page = Math.max(1, Number.parseInt(str(sp.page), 10) || 1);

  const { total, rows, actions } = await getActivity({ page, action, user });
  const pages = Math.max(1, Math.ceil(total / ACTIVITY_PER_PAGE));
  const href = (p: number) => `/admin/activity?${new URLSearchParams({ ...(action && { action }), ...(user && { user }), page: String(p) })}`;

  return (
    <>
      <PageHeader title="ประวัติการใช้งาน" subtitle={`Activity Log (${total.toLocaleString()} รายการ)`} />
      <Card>
        <form className="mb-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-stone-700">ประเภทการกระทำ</span>
            <select name="action" defaultValue={action} className={inputClass}>
              <option value="">ทั้งหมด</option>
              {actions.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-stone-700">ผู้ใช้งาน</span>
            <input name="user" defaultValue={user} placeholder="ค้นหาอีเมล..." className={inputClass} />
          </label>
          <button className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"><Filter className="size-4" aria-hidden />กรอง</button>
          <Link href="/admin/activity" className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm text-stone-600 hover:bg-stone-100"><RotateCcw className="size-4" aria-hidden />รีเซ็ต</Link>
        </form>

        {rows.length === 0 ? (
          <Empty title="ไม่พบข้อมูล" desc="ยังไม่มีประวัติการใช้งานในระบบ" icon={History} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-200 text-left text-stone-500">
                <tr><th className="px-3 py-2">เวลา</th><th className="px-3 py-2">ผู้ใช้งาน</th><th className="px-3 py-2">การกระทำ</th><th className="px-3 py-2">รายละเอียด</th><th className="px-3 py-2">IP</th></tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap px-3 py-2 text-stone-500">{formatDate(r.createdAt, true)}</td>
                    <td className="px-3 py-2">{r.email}</td>
                    <td className="px-3 py-2"><code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">{r.action}</code></td>
                    <td className="px-3 py-2">{r.description || "-"}</td>
                    <td className="px-3 py-2 text-stone-400">{r.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <nav className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-stone-500">
            <span>แสดง {(page - 1) * ACTIVITY_PER_PAGE + 1}–{Math.min(page * ACTIVITY_PER_PAGE, total)} จาก {total.toLocaleString()} รายการ</span>
            <div className="flex gap-1">
              {page > 1 && <Link href={href(page - 1)} aria-label="ก่อนหน้า" className="rounded-lg px-2 py-1 ring-1 ring-stone-200 hover:bg-stone-50"><ChevronLeft className="size-4" /></Link>}
              {Array.from({ length: Math.min(pages, page + 2) - Math.max(1, page - 2) + 1 }, (_, i) => Math.max(1, page - 2) + i).map((p) => (
                <Link key={p} href={href(p)} aria-current={p === page ? "page" : undefined} className={`rounded-lg px-3 py-1 ${p === page ? "bg-stone-900 text-white" : "ring-1 ring-stone-200 hover:bg-stone-50"}`}>{p}</Link>
              ))}
              {page < pages && <Link href={href(page + 1)} aria-label="ถัดไป" className="rounded-lg px-2 py-1 ring-1 ring-stone-200 hover:bg-stone-50"><ChevronRight className="size-4" /></Link>}
            </div>
          </nav>
        )}
      </Card>
    </>
  );
}

export default function ActivityPage(props: PageProps<"/admin/activity">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ActivityPageContent {...props} />
    </Suspense>
  );
}
