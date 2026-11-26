import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/guard";
import { FeedbackProvider } from "@/components/admin/ui";
import { AdminNav } from "@/components/admin/admin-nav";
import PageSkeleton from "./loading";

async function Nav() {
  const user = await getCurrentUser();
  return <AdminNav user={{ name: user.nameTh || user.email, email: user.email, role: user.role, dev: !!user.isDevMode }} />;
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <FeedbackProvider>
      <Suspense fallback={<div className="h-14 border-b border-stone-200 bg-white" />}>
        <Nav />
      </Suspense>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
      </main>
      <footer className="pb-6 text-center text-xs text-stone-400">© Faculty of Nursing, Chiang Mai University</footer>
    </FeedbackProvider>
  );
}
