"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown, Download, ExternalLink, FileSpreadsheet, History, Home, Languages,
  LogOut, Menu, Settings, ShieldCheck, Trophy, Users, Wrench, X, type LucideIcon,
} from "lucide-react";
import { withBase } from "@/lib/base-path";

interface NavLink { href: string; label: string; icon: LucideIcon }

const MAIN: NavLink[] = [
  { href: "/admin", label: "หน้าหลัก", icon: Home },
  { href: "/admin/sets", label: "ชุดรางวัล", icon: Trophy },
  { href: "/admin/gifts", label: "จัดการรางวัล", icon: Wrench },
  { href: "/admin/export", label: "ส่งออกข้อมูล", icon: FileSpreadsheet },
];
const ADMIN: NavLink[] = [
  { href: "/admin/users", label: "จัดการผู้ใช้", icon: Users },
  { href: "/admin/activity", label: "ประวัติการใช้งาน", icon: History },
  { href: "/admin/backup", label: "สำรองข้อมูล", icon: Download },
  { href: "/admin/settings", label: "ตั้งค่าการแสดงผล", icon: Settings },
  { href: "/admin/language", label: "จัดการภาษา", icon: Languages },
];

export function AdminNav({ user }: { user: { name: string; email: string; role: "admin" | "user"; dev: boolean } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const adminRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adminOpen) return;
    const close = (e: MouseEvent) => !adminRef.current?.contains(e.target as Node) && setAdminOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAdminOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [adminOpen]);

  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));
  const isAdmin = user.role === "admin";
  const initials = [...user.name.trim()].slice(0, 1).join("").toUpperCase() || "A";

  const link = (l: NavLink, block = false) => (
    <Link
      key={l.href}
      href={l.href}
      aria-current={isActive(l.href) ? "page" : undefined}
      onClick={() => { setOpen(false); setAdminOpen(false); }}
      className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
        isActive(l.href) ? "bg-brand-50 text-brand-600" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
      } ${block ? "w-full" : ""}`}
    >
      <l.icon className="size-4 shrink-0" aria-hidden />
      {l.label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/admin" className="flex shrink-0 items-center gap-2 font-semibold">
          <Image src={withBase("/logo.png")} alt="" width={32} height={32} className="rounded-full" />
          <span className="hidden text-brand-600 sm:inline">NURSE GIFT</span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="เมนูหลัก">
          {MAIN.map((l) => link(l))}
          {isAdmin && (
            <div ref={adminRef} className="relative">
              <button
                onClick={() => setAdminOpen((o) => !o)}
                aria-expanded={adminOpen}
                aria-haspopup="menu"
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                  ADMIN.some((l) => isActive(l.href)) ? "bg-brand-50 text-brand-600" : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                <ShieldCheck className="size-4" aria-hidden />
                ผู้ดูแลระบบ
                <ChevronDown className={`size-4 transition ${adminOpen ? "rotate-180" : ""}`} aria-hidden />
              </button>
              {adminOpen && (
                <div role="menu" className="absolute left-0 top-full mt-1 grid w-56 animate-card-in gap-0.5 rounded-xl border border-stone-200 bg-white p-1 shadow-lg">
                  {ADMIN.map((l) => link(l, true))}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <a
            href={withBase("/th/live")}
            target="_blank"
            title="เปิดหน้า Live"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 md:flex"
          >
            <ExternalLink className="size-4" aria-hidden /> Live
          </a>
          {user.dev && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">DEV</span>}
          <div className="hidden items-center gap-2 md:flex">
            <span className="flex size-8 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white" aria-hidden>
              {initials}
            </span>
            <div className="leading-tight">
              <p className="max-w-40 truncate text-sm font-medium">{user.name}</p>
              <p className="text-xs capitalize text-stone-500">{user.role}</p>
            </div>
          </div>
          <form action={withBase("/admin/auth/logout")} method="post">
            <button title="ออกจากระบบ" aria-label="ออกจากระบบ" className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">
              <LogOut className="size-4" aria-hidden />
              <span className="hidden sm:inline lg:hidden 2xl:inline">ออกจากระบบ</span>
            </button>
          </form>
          <button
            className="rounded-lg p-2 hover:bg-stone-100 lg:hidden"
            aria-label="เมนู"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="grid gap-1 border-t border-stone-200 px-4 py-3 sm:px-6 lg:hidden" aria-label="เมนูหลัก">
          {MAIN.map((l) => link(l, true))}
          {isAdmin && (
            <>
              <p className="mt-2 px-3 text-xs font-semibold uppercase tracking-wide text-stone-400">ผู้ดูแลระบบ</p>
              {ADMIN.map((l) => link(l, true))}
            </>
          )}
        </nav>
      )}
    </header>
  );
}
