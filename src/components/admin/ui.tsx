"use client";

import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, X, XCircle, type LucideIcon } from "lucide-react";

// ---------------- Toasts (replaces SweetAlert / toast.js) ----------------

type ToastType = "success" | "error" | "warning";
interface Toast { id: number; type: ToastType; title: string; message?: string }

interface Confirm {
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
  resolve: (ok: boolean) => void;
}

const FeedbackContext = createContext<{
  toast: (type: ToastType, title: string, message?: string) => void;
  confirm: (opts: Omit<Confirm, "resolve">) => Promise<boolean>;
} | null>(null);

export function useFeedback() {
  const ctx = use(FeedbackContext);
  if (!ctx) throw new Error("useFeedback must be used inside <FeedbackProvider>");
  return ctx;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<Confirm | null>(null);
  const nextId = useRef(0);

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = ++nextId.current;
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), type === "error" ? 6000 : 3500);
  }, []);

  const confirm = useCallback(
    (opts: Omit<Confirm, "resolve">) => new Promise<boolean>((resolve) => setPending({ ...opts, resolve })),
    [],
  );

  const close = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };

  const tone: Record<ToastType, string> = {
    success: "border-green-500 bg-green-50 text-green-900",
    error: "border-red-500 bg-red-50 text-red-900",
    warning: "border-amber-500 bg-amber-50 text-amber-900",
  };
  const icon: Record<ToastType, LucideIcon> = { success: CheckCircle2, error: XCircle, warning: AlertTriangle };

  return (
    <FeedbackContext value={{ toast, confirm }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={`pointer-events-auto flex animate-card-in gap-3 rounded-xl border-l-4 px-4 py-3 shadow-lg ${tone[t.type]}`}>
            {(() => { const Icon = icon[t.type]; return <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />; })()}
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t.title}</p>
              {t.message && <p className="mt-0.5 text-sm opacity-90">{t.message}</p>}
            </div>
            <button onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))} aria-label="ปิด" className="-m-1 self-start rounded p-1 opacity-60 hover:opacity-100">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <Modal open={!!pending} onClose={() => close(false)} title={pending?.title ?? ""} size="sm">
        <div className="flex gap-3">
          {pending?.danger && (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600"><AlertTriangle className="size-5" /></span>
          )}
          {pending?.message && <p className="pt-2 text-stone-600">{pending.message}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => close(false)}>ยกเลิก</Button>
          <Button variant={pending?.danger ? "danger" : "primary"} onClick={() => close(true)} autoFocus>
            {pending?.confirmLabel ?? "ยืนยัน"}
          </Button>
        </div>
      </Modal>
    </FeedbackContext>
  );
}

// ---------------- Modal ----------------

export function Modal({
  open, onClose, title, children, size = "md",
}: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; size?: "sm" | "md" | "lg" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  const width = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-3xl" }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/50 p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={`max-h-[92dvh] w-full ${width} animate-card-in overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="ปิด" className="-m-1 rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"><X className="size-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------------- Primitives ----------------

type Variant = "primary" | "secondary" | "danger" | "ghost";
const variants: Record<Variant, string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-600",
  secondary: "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-stone-600 hover:bg-stone-100",
};

export function Button({
  variant = "primary", className = "", ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    />
  );
}

export const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-stone-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
    </label>
  );
}

export function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-50 ${checked ? "bg-brand-500" : "bg-stone-300"}`}
    >
      <span className={`inline-block size-5 rounded-full bg-white shadow transition ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}
