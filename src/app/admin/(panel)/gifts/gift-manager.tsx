"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Download, FileUp, FolderPlus, Loader2, Pencil, Plus, Save, Search, Trash2 } from "lucide-react";
import type { GiftRow, Kind } from "@/lib/data/admin";
import { addGift, addGroup, deleteGift, editGift, importGifts, type ActionResult } from "@/actions/admin";
import { Card, KindBadge } from "@/components/admin/layout-bits";
import { Button, Field, Modal, inputClass, useFeedback } from "@/components/admin/ui";
import { withBase } from "@/lib/base-path";

const PAGE_SIZE = 25;
type Dialog = { type: "add" } | { type: "edit"; gift: GiftRow } | { type: "import" } | { type: "group" } | null;

export function GiftManager({ kind, gifts, groups, winners }: { kind: Kind; gifts: GiftRow[]; groups: number[]; winners: number }) {
  const { toast, confirm } = useFeedback();
  const [pending, start] = useTransition();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [tab, setTab] = useState<number | "all">("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return gifts.filter((g) => (tab === "all" || g.datagroup === tab) && (!q || g.giftname.toLowerCase().includes(q)));
  }, [gifts, tab, query]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  /** Run an action, toast the result, close the dialog on success. */
  const act = (fn: () => Promise<ActionResult>, successTitle = "สำเร็จ") =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast("success", successTitle, res.message);
        setDialog(null);
      } else toast("error", "ข้อผิดพลาด", res.message);
    });

  const remove = async (g: GiftRow) => {
    const ok = await confirm({ title: "ยืนยัน?", message: `ต้องการลบ "${g.giftname}"?`, confirmLabel: "ลบ", danger: true });
    if (ok) act(() => deleteGift(kind, g.id), "ลบสำเร็จ");
  };

  const isMain = kind === "main";
  const kindLabel = isMain ? "ใหญ่" : "ย่อย";

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <KindBadge kind={kind} /> ของรางวัล({isMain ? "ใหญ่" : "ย่อย"})
          <span className="text-sm font-normal text-stone-500">
            · {gifts.length.toLocaleString()} รางวัล · {groups.length} ชุด · {winners.toLocaleString()} ผู้รับ
          </span>
        </span>
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setDialog({ type: "add" })}><Plus className="size-4" aria-hidden /> เพิ่มรางวัล</Button>
          <Button variant="secondary" onClick={() => setDialog({ type: "import" })}><FileUp className="size-4" aria-hidden /> นำเข้า Excel</Button>
          <Button variant="secondary" onClick={() => setDialog({ type: "group" })}><FolderPlus className="size-4" aria-hidden /> เพิ่มชุดรางวัล</Button>
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(
          <div className="flex flex-wrap gap-1" role="tablist">
            {(["all", ...groups] as const).map((g) => (
              <button
                key={g}
                role="tab"
                aria-selected={tab === g}
                onClick={() => { setTab(g); setPage(1); }}
                className={`rounded-full px-3 py-1 text-sm ${tab === g ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}
              >
                {g === "all" ? "ทั้งหมด" : `ชุดที่ ${g}`}
              </button>
            ))}
          </div>
        )}
        <div className="relative ml-auto w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="ค้นหาชื่อรางวัล..."
            aria-label="ค้นหาชื่อรางวัล"
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-stone-200">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="w-16 px-3 py-2 text-center">ลำดับ</th>
              <th className="px-3 py-2">ชื่อของรางวัล</th>
              <th className="w-20 px-3 py-2 text-center">ชุดที่</th>
              <th className="w-28 px-3 py-2 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.length === 0 ? (
              <tr><td colSpan={4} className="px-3 py-8 text-center text-stone-400">ไม่พบข้อมูล</td></tr>
            ) : (
              rows.map((g, i) => (
                <tr key={g.id} className="hover:bg-stone-50">
                  <td className="px-3 py-2 text-center text-stone-400">{(current - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="px-3 py-2 break-words">{g.giftname}</td>
                  <td className="px-3 py-2 text-center">{g.datagroup}</td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => setDialog({ type: "edit", gift: g })} title="แก้ไข" aria-label={`แก้ไข ${g.giftname}`} className="rounded-lg p-2 text-stone-500 hover:bg-brand-50 hover:text-brand-600">
                        <Pencil className="size-4" aria-hidden />
                      </button>
                      <button onClick={() => remove(g)} disabled={pending} title="ลบ" aria-label={`ลบ ${g.giftname}`} className="rounded-lg p-2 text-stone-500 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm text-stone-500">
          <span>แสดง {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, filtered.length)} จาก {filtered.length}</span>
          <div className="flex gap-1">
            <Button variant="secondary" disabled={current <= 1} onClick={() => setPage(current - 1)} aria-label="ก่อนหน้า"><ChevronLeft className="size-4" aria-hidden /></Button>
            <span className="flex items-center px-2 tabular-nums">{current} / {pages}</span>
            <Button variant="secondary" disabled={current >= pages} onClick={() => setPage(current + 1)} aria-label="ถัดไป"><ChevronRight className="size-4" aria-hidden /></Button>
          </div>
        </div>
      )}

      {/* ---- Dialogs ---- */}
      <Modal open={dialog?.type === "add" || dialog?.type === "edit"} onClose={() => setDialog(null)} title={dialog?.type === "edit" ? "แก้ไขของรางวัล" : `เพิ่มของรางวัล${kindLabel}`}>
        {(dialog?.type === "add" || dialog?.type === "edit") && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const name = String(fd.get("giftname") ?? "");
              const dg = Number(fd.get("datagroup") ?? 0);
              act(() => (dialog.type === "edit" ? editGift(kind, dialog.gift.id, name, dg) : addGift(kind, name, dg)));
            }}
          >
            <Field label="ชื่อของรางวัล">
              <input name="giftname" required autoFocus defaultValue={dialog.type === "edit" ? dialog.gift.giftname : ""} className={inputClass} />
            </Field>
            {(
              <Field label="ชุดที่">
                <select
                  name="datagroup"
                  required
                  defaultValue={dialog.type === "edit" ? String(dialog.gift.datagroup) : tab === "all" ? String(groups[0] ?? "") : String(tab)}
                  className={inputClass}
                >
                  {groups.length === 0 && <option value="">ไม่มีข้อมูลกลุ่ม — เพิ่มชุดรางวัลก่อน</option>}
                  {groups.map((g) => <option key={g} value={g}>ชุดที่ {g}</option>)}
                </select>
              </Field>
            )}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />} บันทึก
            </Button>
          </form>
        )}
      </Modal>

      <Modal open={dialog?.type === "import"} onClose={() => setDialog(null)} title={`นำเข้าไฟล์ Excel (รางวัล${kindLabel})`}>
        <div className="mb-4 rounded-xl bg-stone-50 p-4 text-sm text-stone-600">
          คอลัมน์ A = ชื่อรางวัล, คอลัมน์ B = ชุดที่ (ชุดที่ยังไม่มีจะถูกสร้างอัตโนมัติ, แถวหัวตารางจะถูกข้าม) ·{" "}
          <a href={withBase("/gift_template.csv")} download className="inline-flex items-center gap-1 text-brand-600 underline"><Download className="size-3.5" aria-hidden />ดาวน์โหลดแบบฟอร์ม</a>
        </div>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); act(() => importGifts(kind, fd), "นำเข้าสำเร็จ"); }}>
          <Field label="เลือกไฟล์ (.xlsx, .xls, .csv — สูงสุด 5MB)">
            <input type="file" name="file" accept=".xlsx,.xls,.csv" required className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-brand-700`} />
          </Field>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? <><Loader2 className="size-4 animate-spin" aria-hidden /> กำลังนำเข้า...</> : <><FileUp className="size-4" aria-hidden /> นำเข้าข้อมูล</>}
          </Button>
        </form>
      </Modal>

      <Modal open={dialog?.type === "group"} onClose={() => setDialog(null)} title="เพิ่มชุดของรางวัล" size="sm">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); const dg = Number(new FormData(e.currentTarget).get("datagroup")); act(() => addGroup(dg)); }}>
          <Field label="ชุดที่ (ตัวเลข)">
            <input type="number" name="datagroup" min={1} required autoFocus placeholder="เช่น 1, 2, 3" defaultValue={(groups.at(-1) ?? 0) + 1} className={inputClass} />
          </Field>
          <Button type="submit" disabled={pending} className="w-full"><FolderPlus className="size-4" aria-hidden /> เพิ่มชุดใหม่</Button>
        </form>
      </Modal>
    </Card>
  );
}
