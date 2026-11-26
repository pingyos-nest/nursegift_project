import Image from "next/image";
import { Suspense } from "react";
import { AlertCircle, LogIn, ShieldCheck, Wrench } from "lucide-react";
import { isDevLoginEnabled } from "@/lib/auth/guard";
import { withBase } from "@/lib/base-path";

export const metadata = { title: "เข้าสู่ระบบ" };

const ERRORS: Record<string, string> = {
  forbidden: "คุณไม่มีสิทธิ์เข้าใช้งานระบบ Admin",
  oauth: "การเข้าสู่ระบบด้วย CMU Account ถูกยกเลิกหรือผิดพลาด",
  state: "เซสชันการเข้าสู่ระบบหมดอายุ กรุณาลองใหม่",
  token: "ไม่สามารถรับ access_token ได้",
  profile: "ไม่สามารถดึงข้อมูลผู้ใช้จาก CMU API ได้",
};

async function LoginError({ searchParams }: { searchParams: PageProps<"/admin/login">["searchParams"] }) {
  const { error } = await searchParams;
  const message = typeof error === "string" ? ERRORS[error] : undefined;
  if (!message) return null;
  return (
    <p role="alert" className="mt-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> {message}
    </p>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const dev = isDevLoginEnabled();

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200">
        <Image src={withBase("/logo.png")} alt="" width={64} height={64} className="mx-auto rounded-full" priority />
        <h1 className="mt-4 text-xl font-semibold text-brand-600">Admin</h1>
        <p className="mt-1 text-sm text-stone-500">ระบบจัดการของรางวัล</p>

        <Suspense>
          <LoginError searchParams={searchParams} />
        </Suspense>

        <a
          href={withBase("/admin/auth/signin")}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 font-medium text-white transition hover:bg-brand-600"
        >
          <LogIn className="size-5" aria-hidden /> เข้าสู่ระบบด้วย CMU Account
        </a>
        <p className="mt-4 flex items-center justify-center gap-1 text-xs text-stone-500"><ShieldCheck className="size-3.5" aria-hidden />เฉพาะผู้ที่ได้รับสิทธิ์เท่านั้น</p>

        {dev && (
          <form action={withBase("/admin/auth/dev")} method="post" className="mt-6 border-t border-dashed border-amber-300 pt-4">
            <p className="mb-2 flex items-center justify-center gap-1 text-xs font-semibold text-amber-700"><Wrench className="size-3.5" aria-hidden />DEV LOGIN (ไม่แสดงใน production)</p>
            <div className="flex gap-2">
              <button name="role" value="admin" className="flex-1 rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-200">Admin</button>
              <button name="role" value="user" className="flex-1 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100">User</button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
