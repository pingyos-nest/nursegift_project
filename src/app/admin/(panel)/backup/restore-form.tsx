"use client";

import { useTransition } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { restoreBackup } from "@/actions/admin";
import { Button, inputClass, useFeedback } from "@/components/admin/ui";

export function RestoreForm() {
  const { toast, confirm } = useFeedback();
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        const ok = await confirm({
          title: "ยืนยันการกู้คืน?",
          message: "ข้อมูลปัจจุบันจะถูกลบทั้งหมดและแทนที่ด้วยข้อมูลจากไฟล์สำรอง",
          confirmLabel: "กู้คืนข้อมูล",
          danger: true,
        });
        if (!ok) return;
        start(async () => {
          const res = await restoreBackup(fd);
          if (res.ok) { toast("success", "กู้คืนสำเร็จ", res.message); form.reset(); }
          else toast("error", "เกิดข้อผิดพลาด", res.message);
        });
      }}
    >
      <input type="file" name="file" accept=".json,application/json" required className={inputClass} />
      <Button type="submit" variant="danger" disabled={pending}>{pending ? <><Loader2 className="size-4 animate-spin" aria-hidden /> กำลังกู้คืน...</> : <><RotateCcw className="size-4" aria-hidden /> กู้คืนข้อมูล</>}</Button>
    </form>
  );
}
