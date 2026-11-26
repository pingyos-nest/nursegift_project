"use client";

import Link from "next/link";
import { Eye, ExternalLink, RotateCcw, Save } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { saveLanguage } from "@/actions/admin";
import { Card } from "@/components/admin/layout-bits";
import { Button, inputClass, useFeedback } from "@/components/admin/ui";
import { withBase } from "@/lib/base-path";

interface Section { name: string; path: string; keys: string[] }

export function LanguageEditor({ code, sections, initial }: { code: "th" | "en"; sections: Section[]; initial: Record<string, string> }) {
  const { toast } = useFeedback();
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [preview, setPreview] = useState(withBase(`/${code}`));
  const [pending, start] = useTransition();
  const frame = useRef<HTMLIFrameElement>(null);

  const changed = Object.keys(values).filter((k) => values[k] !== saved[k]);

  const save = () =>
    start(async () => {
      const res = await saveLanguage(code, Object.fromEntries(changed.map((k) => [k, values[k]])));
      if (res.ok) {
        toast("success", "บันทึกสำเร็จ", res.message);
        setSaved(values);
        if (frame.current) frame.current.src = preview;
      } else toast("error", "ข้อผิดพลาด", res.message);
    });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["th", "en"] as const).map((c) => (
          <Link key={c} href={`/admin/language?lang=${c}`} className={`rounded-full px-4 py-2 text-sm font-medium ${c === code ? "bg-stone-900 text-white" : "bg-white ring-1 ring-stone-200 hover:bg-stone-50"}`}>
            {c === "th" ? "ไทย" : "English"}
          </Link>
        ))}
        <a href={withBase(`/${code}`)} target="_blank" className="ml-auto flex items-center gap-1 text-sm text-brand-600 hover:underline">เปิดหน้าเว็บ <ExternalLink className="size-4" aria-hidden /></a>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          {sections.map((s) => (
            <Card key={s.name} title={s.name} actions={<button type="button" onClick={() => setPreview(withBase(`/${code}${s.path}`))} className="flex items-center gap-1 text-sm text-brand-600 hover:underline"><Eye className="size-4" aria-hidden />ดูตัวอย่าง</button>}>
              <div className="space-y-3">
                {s.keys.map((k) => (
                  <label key={k} className="block">
                    <span className="mb-1 block font-mono text-xs text-stone-500">{k}</span>
                    <input
                      value={values[k] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
                      className={`${inputClass} ${values[k] !== saved[k] ? "border-amber-400 bg-amber-50" : ""}`}
                    />
                  </label>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card title="ตัวอย่าง (Live Preview)">
            <iframe ref={frame} src={preview} title="Preview" className="h-[480px] w-full rounded-xl border border-stone-200" />
          </Card>
          <Card title={`การเปลี่ยนแปลง (${changed.length})`} className="mt-4">
            {changed.length === 0 ? (
              <p className="text-sm text-stone-400">ยังไม่มีการเปลี่ยนแปลง</p>
            ) : (
              <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
                {changed.map((k) => (
                  <li key={k}>
                    <span className="font-mono text-xs text-stone-500">{k}</span>
                    <p className="text-stone-400 line-through">{saved[k]}</p>
                    <p className="text-green-700">{values[k]}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex gap-2">
              <Button onClick={save} disabled={pending || changed.length === 0}><Save className="size-4" aria-hidden />บันทึกการเปลี่ยนแปลง</Button>
              <Button variant="ghost" onClick={() => setValues(saved)} disabled={changed.length === 0}><RotateCcw className="size-4" aria-hidden />รีเซ็ต</Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
