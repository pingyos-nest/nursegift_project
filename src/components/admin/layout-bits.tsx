import type { ReactNode } from "react";
import { Inbox, type LucideIcon } from "lucide-react";

/** Server-safe presentational pieces shared by admin pages. */

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">{title}</h1>
        {subtitle && <p className="mt-1 text-stone-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>;
}

const TONES = {
  stone: { text: "text-stone-900", icon: "bg-stone-100 text-stone-600" },
  brand: { text: "text-brand-600", icon: "bg-brand-50 text-brand-600" },
  green: { text: "text-green-600", icon: "bg-green-50 text-green-600" },
  sky: { text: "text-sky-600", icon: "bg-sky-50 text-sky-600" },
};

export function Stat({ label, value, tone = "stone", icon: Icon }: { label: string; value: number; tone?: keyof typeof TONES; icon?: LucideIcon }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4">
      {Icon && (
        <span className={`hidden size-11 shrink-0 items-center justify-center rounded-xl sm:flex ${TONES[tone].icon}`}>
          <Icon className="size-5" aria-hidden />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm text-stone-500">{label}</p>
        <p className={`text-2xl font-bold tabular-nums ${TONES[tone].text}`}>{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

export function Card({ title, actions, children, className = "" }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-stone-200 bg-white p-5 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="font-semibold text-stone-800">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Empty({ title, desc, icon: Icon = Inbox, children }: { title: string; desc?: string; icon?: LucideIcon; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 px-4 py-10 text-center">
      <Icon className="mx-auto mb-3 size-10 text-stone-300" aria-hidden />
      <p className="font-medium text-stone-700">{title}</p>
      {desc && <p className="mt-1 text-sm text-stone-500">{desc}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function KindBadge({ kind }: { kind: "main" | "sub" }) {
  return kind === "main" ? (
    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">ใหญ่</span>
  ) : (
    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">ย่อย</span>
  );
}
