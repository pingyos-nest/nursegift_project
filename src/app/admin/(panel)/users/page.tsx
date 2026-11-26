import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/guard";
import { getAdminUsers } from "@/lib/data/admin";
import { PageHeader } from "@/components/admin/layout-bits";
import PageSkeleton from "../loading";
import { UserManager } from "./user-manager";

export const metadata = { title: "จัดการผู้ใช้งาน" };

async function Users() {
  const me = await requireAdmin();
  const users = await getAdminUsers();
  return <UserManager users={users} myEmail={me.email} />;
}

export default function UsersPage() {
  return (
    <>
      <PageHeader title="จัดการผู้ใช้งาน" subtitle="User Management — เฉพาะอีเมลในรายการนี้ที่เข้าสู่ระบบ Admin ได้" />
      <Suspense fallback={<PageSkeleton />}>
        <Users />
      </Suspense>
    </>
  );
}
