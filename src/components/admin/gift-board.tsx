"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { CheckCircle2, CircleDashed, Clock, Eye, EyeOff, Gift, Loader2, Save, Search, Trash2, UserRound } from "lucide-react";
import type { GiftWithCount, Kind, WinnerRecord } from "@/lib/data/admin";
import { addWinner, deleteWinner, fetchWinners, setLiveVisibility } from "@/actions/admin";
import { formatDate } from "@/lib/utils/text";
import { Button, Modal, Switch, inputClass, useFeedback } from "./ui";

type Status = "all" | "empty" | "claimed";

/** Port of gif-group.php / group-sub.php: pick a prize card, record winners. */
export function GiftBoard({ kind, datagroup, gifts, liveVisible }: { kind: Kind; datagroup: number; gifts: GiftWithCount[]; liveVisible: boolean }) {
  const router = useRouter();
  const { toast, confirm } = useFeedback();
  const [selected, setSelected] = useState<GiftWithCount | null>(null);
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [live, setLive] = useState(liveVisible);
  const [savingLive, startLive] = useTransition();

  const counts = useMemo(
    () => ({ all: gifts.length, empty: gifts.filter((g) => g.userCount === 0).length, claimed: gifts.filter((g) => g.userCount > 0).length }),
    [gifts],
  );

  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return gifts.filter(
      (g) =>
        (status === "all" || (status === "empty" ? g.userCount === 0 : g.userCount > 0)) &&
        (!q || g.giftname.toLowerCase().includes(q) || String(g.id) === q),
    );
  }, [gifts, filter, status]);

  const toggleLive = (v: boolean) => {
    setLive(v);
    startLive(async () => {
      const res = await setLiveVisibility(kind, v, datagroup);
      if (res.ok) toast("success", "บันทึกแล้ว", res.message);
      else {
        setLive(!v);
        toast("error", "ผิดพลาด", res.message);
      }
    });
  };

  const chips: { key: Status; label: string }[] = [
    { key: "all", label: "ทั้งหมด" },
    { key: "empty", label: "ว่าง" },
    { key: "claimed", label: "มีผู้รับแล้ว" },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" aria-hidden />
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="ค้นหาของรางวัล..."
            aria-label="ค้นหาของรางวัล"
            className={`${inputClass} pl-9`}
          />
        </div>
        <div className="flex gap-1" role="tablist" aria-label="กรองสถานะ">
          {chips.map((c) => (
            <button
              key={c.key}
              role="tab"
              aria-selected={status === c.key}
              onClick={() => setStatus(c.key)}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                status === c.key ? "bg-stone-900 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
              }`}
            >
              {c.label} <span className="ml-0.5 tabular-nums opacity-70">{counts[c.key]}</span>
            </button>
          ))}
        </div>
        <div className="flex w-full items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-2 sm:ml-auto sm:w-auto">
          {live ? <Eye className="size-5 text-green-600" aria-hidden /> : <EyeOff className="size-5 text-stone-400" aria-hidden />}
          <div className="flex-1 leading-tight">
            <p className="text-sm font-medium">แสดงในหน้า Live</p>
            <p className={`text-xs ${live ? "text-green-600" : "text-stone-400"}`}>{live ? "กำลังแสดง" : "ไม่แสดง"}</p>
          </div>
          <Switch checked={live} onChange={toggleLive} disabled={savingLive} label="แสดงในหน้า Live" />
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 py-12 text-center text-stone-500">
          <Gift className="mx-auto mb-2 size-10 text-stone-300" aria-hidden />
          ไม่พบของรางวัล
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {shown.map((g) => {
            const claimed = g.userCount > 0;
            return (
              <button
                key={g.id}
                onClick={() => setSelected(g)}
                className={`group flex min-h-32 flex-col justify-between rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 ${
                  claimed ? "border-green-200 bg-green-50/60" : "border-stone-200 bg-white hover:border-brand-500"
                }`}
              >
                <div className="flex items-start gap-2">
                  <Gift className={`mt-0.5 size-4 shrink-0 ${claimed ? "text-green-600" : "text-brand-500"}`} aria-hidden />
                  <p className="font-medium leading-snug break-words">{g.giftname}</p>
                </div>
                <span
                  className={`mt-3 flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    claimed ? "bg-green-600 text-white" : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {claimed ? <CheckCircle2 className="size-3.5" aria-hidden /> : <CircleDashed className="size-3.5" aria-hidden />}
                  {claimed ? `มีผู้รับแล้ว ${g.userCount} ท่าน` : "ว่าง"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <WinnerModal
          key={selected.id}
          kind={kind}
          gift={selected}
          onClose={() => setSelected(null)}
          onChanged={() => router.refresh()}
          toast={toast}
          confirm={confirm}
        />
      )}
    </>
  );
}

function WinnerModal({
  kind, gift, onClose, onChanged, toast, confirm,
}: {
  kind: Kind;
  gift: GiftWithCount;
  onClose: () => void;
  onChanged: () => void;
  toast: ReturnType<typeof useFeedback>["toast"];
  confirm: ReturnType<typeof useFeedback>["confirm"];
}) {
  const [history, setHistory] = useState<WinnerRecord[] | null>(null);
  const [name, setName] = useState("");
  const [pending, start] = useTransition();

  const reload = () => fetchWinners(kind, gift.id).then(setHistory).catch(() => setHistory([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    start(async () => {
      const res = await addWinner(kind, gift.id, name);
      if (res.ok) {
        toast("success", "บันทึกสำเร็จ", `${name.trim()} — ${gift.giftname}`);
        setName("");
        onChanged();
        onClose();
      } else {
        toast(res.code === "already_received" ? "warning" : "error", res.code === "already_received" ? "ไม่สามารถเพิ่มได้" : "ข้อผิดพลาด", res.message);
      }
    });
  };

  const remove = async (w: WinnerRecord) => {
    if (!(await confirm({ title: "ลบผู้โชคดี?", message: `ต้องการลบ ${w.name} ออกจาก "${gift.giftname}"?`, confirmLabel: "ลบ", danger: true }))) return;
    start(async () => {
      const res = await deleteWinner(kind, w.id);
      if (res.ok) {
        toast("success", "ลบสำเร็จ");
        await reload();
        onChanged();
      } else toast("error", "ล้มเหลว", res.message);
    });
  };

  return (
    <Modal open onClose={onClose} title="บันทึกผู้โชคดี" size="lg">
      <div className="mb-5 flex items-center gap-3 rounded-xl bg-brand-50 p-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600">
          <Gift className="size-6" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-lg font-semibold break-words">{gift.giftname}</p>
          <p className="text-xs text-stone-500">รหัสรางวัล #{gift.id}</p>
        </div>
      </div>

      <form onSubmit={submit} className="mb-6">
        <label htmlFor="winner-name" className="mb-1 block text-sm font-medium">หมายเลข / ชื่อผู้โชคดี</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" aria-hidden />
            <input
              id="winner-name"
              autoFocus
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น 1001"
              className={`${inputClass} pl-9 text-lg`}
              required
            />
          </div>
          <Button type="submit" disabled={pending || !name.trim()}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
            บันทึก
          </Button>
        </div>
        <p className="mt-1 text-xs text-stone-500">กด Enter เพื่อบันทึก · 1 คนได้รับรางวัลสูงสุด 2 ชิ้น (รวมใหญ่+ย่อย)</p>
      </form>

      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-700">
        <Clock className="size-4" aria-hidden /> ประวัติผู้ได้รับรางวัลนี้
        {history && history.length > 0 && <span className="rounded-full bg-stone-100 px-2 text-xs font-medium text-stone-600">{history.length}</span>}
      </h3>
      {history === null ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 py-6 text-sm text-stone-400">
          <Loader2 className="size-4 animate-spin" aria-hidden /> กำลังโหลด...
        </div>
      ) : history.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 py-6 text-center text-sm text-stone-400">ยังไม่มีผู้ได้รับรางวัลนี้</p>
      ) : (
        <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200">
          {history.map((w) => (
            <li key={w.id} className="flex items-center gap-3 px-3 py-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
                <UserRound className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{w.name}</p>
                <p className="text-xs text-stone-500">{formatDate(w.dateCreate)}</p>
              </div>
              <button
                onClick={() => remove(w)}
                disabled={pending}
                aria-label={`ลบ ${w.name}`}
                title="ลบ"
                className="rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
