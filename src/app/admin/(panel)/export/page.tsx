import { Suspense } from "react";
import PageSkeleton from "../loading";
import Link from "next/link";
import { withBase } from "@/lib/base-path";
import { FileSpreadsheet, Gift, PartyPopper, Trophy } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/guard";
import { countWinners, getExportRows, getGroups } from "@/lib/data/admin";
import { Card, Empty, PageHeader } from "@/components/admin/layout-bits";
import { formatDate } from "@/lib/utils/text";
import { GroupSelect, PrintButton } from "./controls";

export const metadata = { title: "ส่งออกข้อมูล" };

async function ExportPageContent({ searchParams }: PageProps<"/admin/export">) {
  await getCurrentUser();
  const sp = await searchParams;
  const tab = sp.tab === "sub" ? "sub" : "main";
  const dgNum = Number(sp.datagroup);
  const dg = Number.isInteger(dgNum) && dgNum > 0 ? dgNum : "all";

  const [groups, rows, mainCount, subCount] = await Promise.all([
    getGroups(), getExportRows(tab, dg), countWinners("main"), countWinners("sub"),
  ]);
  const csvHref = withBase(`/admin/export/csv?tab=${tab}&datagroup=${dg}`);

  const tabLink = (t: "main" | "sub", label: string, n: number) => {
    const Icon = t === "main" ? Trophy : Gift;
    return (
    <Link
      href={`/admin/export?tab=${t}`}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${tab === t ? "bg-stone-900 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"}`}
    >
      <Icon className="size-4" aria-hidden /> {label} <span className="opacity-70 tabular-nums">{n.toLocaleString()}</span>
    </Link>
    );
  };

  return (
    <>
      <PageHeader title="รายชื่อผู้โชคดี" subtitle="Export Winners Data" />
      <div className="mb-4 flex gap-2 print:hidden">
        {tabLink("main", "ของรางวัล(ใหญ่)", mainCount)}
        {tabLink("sub", "ของรางวัล(ย่อย)", subCount)}
      </div>

      <Card
        title={`รายชื่อผู้โชคดี (${tab === "main" ? "ใหญ่" : "ย่อย"})${dg === "all" ? " (ทั้งหมด)" : ` (ชุดที่ ${dg})`} — ${rows.length.toLocaleString()} คน`}
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <GroupSelect tab={tab} groups={groups} value={String(dg)} />
            <a href={csvHref} className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"><FileSpreadsheet className="size-4" aria-hidden />Export CSV</a>
            <PrintButton />
          </div>
        }
      >
        {rows.length === 0 ? (
          <Empty title="ไม่มีข้อมูลผู้โชคดี" desc="ยังไม่มีการบันทึกผู้โชคดีในระบบ" icon={PartyPopper} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-200 text-left text-stone-500">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">ชื่อผู้โชคดี</th>
                  <th className="px-3 py-2">ของรางวัล</th>
                  <th className="px-3 py-2 text-center">ชุดที่</th>
                  <th className="px-3 py-2">วันที่</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-stone-400">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">{r.name}</td>
                    <td className="px-3 py-2">{r.giftname || "-"}</td>
                    <td className="px-3 py-2 text-center">{r.datagroup ?? "-"}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-stone-500">{formatDate(r.dateCreate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

export default function ExportPage(props: PageProps<"/admin/export">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ExportPageContent {...props} />
    </Suspense>
  );
}
