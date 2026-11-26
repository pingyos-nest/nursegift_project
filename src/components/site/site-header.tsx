"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Globe, Home, Menu, Radio, Search, X } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { withBase } from "@/lib/base-path";

export function SiteHeader({ lang, t }: { lang: Locale; t: Dictionary }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const sub = pathname.replace(/^\/(th|en)/, "");

  const links = [
    { href: `/${lang}`, label: t.nav_home, icon: Home },
    { href: `/${lang}/live`, label: t.nav_live, icon: Radio },
    { href: `/${lang}/search`, label: t.nav_search, icon: Search },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href={`/${lang}`} className="flex items-center gap-2 font-semibold">
          <Image src={withBase("/logo.png")} alt="" width={36} height={36} className="rounded-full" priority />
          <span className="text-brand-600">NURSE GIFT</span>
        </Link>

        <button
          type="button"
          className="rounded-lg p-2 text-stone-700 hover:bg-stone-100 md:hidden"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <div
          className={`${open ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col gap-1 border-b border-stone-200 bg-white px-4 pb-4 md:static md:flex md:flex-row md:items-center md:gap-6 md:border-0 md:bg-transparent md:p-0`}
        >
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-brand-50 text-brand-600" : "text-stone-700 hover:text-brand-600"
                }`}
              >
                <l.icon className="size-4" aria-hidden />
                {l.label}
              </Link>
            );
          })}
          <div className="flex w-fit items-center gap-1 rounded-full border border-stone-200 p-0.5 pl-2 text-xs font-semibold">
            <Globe className="size-3.5 text-stone-400" aria-hidden />
            {(["th", "en"] as const).map((code) => (
              <Link
                key={code}
                href={`/${code}${sub}`}
                onClick={() => setOpen(false)}
                className={`rounded-full px-3 py-1 ${
                  code === lang ? "bg-brand-500 text-white" : "text-stone-500 hover:text-stone-900"
                }`}
              >
                {code.toUpperCase()}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}
