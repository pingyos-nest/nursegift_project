import type { ReactNode } from "react";

export function PageHero({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <section className="bg-gradient-to-b from-brand-50 to-stone-50 px-4 pb-8 pt-12 text-center">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold leading-snug text-stone-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-3 text-base text-stone-600 sm:text-lg">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}

export function LiveBadge({ label = "LIVE" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-xs font-bold tracking-wider text-white">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-white" />
      </span>
      {label}
    </span>
  );
}
