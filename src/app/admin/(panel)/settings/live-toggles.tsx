"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { setLiveVisibility } from "@/actions/admin";
import { KindBadge } from "@/components/admin/layout-bits";
import { Switch, useFeedback } from "@/components/admin/ui";

interface Item { kind: "main" | "sub"; datagroup: number; label: string; visible: boolean }

export function LiveToggles({ items }: { items: Item[] }) {
  const { toast } = useFeedback();
  const [state, setState] = useState(() => items.map((i) => i.visible));
  const [pending, start] = useTransition();

  const toggle = (idx: number, v: boolean) => {
    const item = items[idx];
    setState((s) => s.map((x, i) => (i === idx ? v : x)));
    start(async () => {
      const res = await setLiveVisibility(item.kind, v, item.datagroup);
      if (res.ok) toast("success", "บันทึกแล้ว", `${item.label}: ${v ? "แสดง" : "ซ่อน"}`);
      else {
        setState((s) => s.map((x, i) => (i === idx ? !v : x)));
        toast("error", "ผิดพลาด", res.message);
      }
    });
  };

  return (
    <ul className="divide-y divide-stone-100">
      {items.map((item, i) => (
        <li key={`${item.kind}-${item.datagroup}`} className="flex items-center gap-3 py-3">
          <KindBadge kind={item.kind} />
          <span className="flex-1 font-medium">{item.label}</span>
          <span className={`flex items-center gap-1 text-sm ${state[i] ? "text-green-600" : "text-stone-400"}`}>
            {state[i] ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
            <span className="hidden sm:inline">{state[i] ? "แสดง" : "ซ่อน"}</span>
          </span>
          <Switch checked={state[i]} onChange={(v) => toggle(i, v)} disabled={pending} label={item.label} />
        </li>
      ))}
    </ul>
  );
}
