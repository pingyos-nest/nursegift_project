"use client";

import { useState, useTransition } from "react";
import { FolderPlus, Trash2 } from "lucide-react";
import { addGroup, deleteGroup } from "@/actions/admin";
import { Button, Field, Modal, inputClass, useFeedback } from "./ui";

export function DeleteGroupButton({ datagroup }: { datagroup: number }) {
  const { confirm, toast } = useFeedback();
  const [pending, start] = useTransition();

  const onClick = async () => {
    const ok = await confirm({
      title: "ลบชุดรางวัล?",
      message: `ชุดที่ ${datagroup} จะถูกลบ — ของรางวัลใหญ่และย่อยในชุดนี้ยังคงอยู่ และจะกลับมาแสดงเมื่อสร้างชุดนี้ใหม่`,
      confirmLabel: "ลบ",
      danger: true,
    });
    if (!ok) return;
    start(async () => {
      const res = await deleteGroup(datagroup);
      if (res.ok) toast("success", "ลบสำเร็จ");
      else toast("error", "ข้อผิดพลาด", res.message);
    });
  };

  return (
    <button
      onClick={onClick}
      disabled={pending}
      title="ลบชุดรางวัล"
      aria-label={`ลบชุดที่ ${datagroup}`}
      className="absolute right-2 top-2 rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
    >
      <Trash2 className="size-4" aria-hidden />
    </button>
  );
}

export function AddGroupButton({ next, variant = "primary" }: { next: number; variant?: "primary" | "secondary" }) {
  const { toast } = useFeedback();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <FolderPlus className="size-4" aria-hidden /> เพิ่มชุดรางวัล
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="เพิ่มชุดรางวัล" size="sm">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const dg = Number(new FormData(e.currentTarget).get("datagroup"));
            start(async () => {
              const res = await addGroup(dg);
              if (res.ok) { toast("success", "สำเร็จ", res.message); setOpen(false); }
              else toast("error", "ข้อผิดพลาด", res.message);
            });
          }}
        >
          <Field label="ชุดที่ (ตัวเลข)">
            <input type="number" name="datagroup" min={1} required autoFocus defaultValue={next} className={inputClass} />
          </Field>
          <Button type="submit" disabled={pending} className="w-full"><FolderPlus className="size-4" aria-hidden /> เพิ่มชุดใหม่</Button>
        </form>
      </Modal>
    </>
  );
}
