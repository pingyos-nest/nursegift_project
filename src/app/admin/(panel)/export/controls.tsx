"use client";

import { useRouter } from "next/navigation";
import { Printer } from "lucide-react";
import { inputClass } from "@/components/admin/ui";

export function GroupSelect({ tab, groups, value }: { tab: "main" | "sub"; groups: number[]; value: string }) {
  const router = useRouter();
  return (
    <select
      aria-label="เลือกชุดรางวัล"
      value={value}
      onChange={(e) => router.push(`/admin/export?tab=${tab}&datagroup=${e.target.value}`)}
      className={`${inputClass} w-auto py-1.5`}
    >
      <option value="all">ทั้งหมด</option>
      {groups.map((g) => <option key={g} value={g}>ชุดที่ {g}</option>)}
    </select>
  );
}

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm hover:bg-stone-50">
      <Printer className="size-4" aria-hidden /> พิมพ์
    </button>
  );
}
