import { Suspense } from "react";
import PageSkeleton from "../loading";
import { requireAdmin } from "@/lib/auth/guard";
import { getGroups, getSettings, liveKey } from "@/lib/data/admin";
import { Card, PageHeader } from "@/components/admin/layout-bits";
import { LiveToggles } from "./live-toggles";

export const metadata = { title: "ตั้งค่าการแสดงผล" };

async function SettingsPageContent() {
  await requireAdmin();
  const [groups, settings] = await Promise.all([getGroups(), getSettings()]);
  const visible = (key: string) => (settings.get(key) ?? "1") === "1";

  return (
    <>
      <PageHeader title="ตั้งค่าการแสดงผล Live" subtitle="Live Display Settings — การเปลี่ยนแปลงมีผลทันทีในหน้า Live" />
      <Card title="การแสดงผลหน้า Live Data">
        <LiveToggles
          items={[
            ...groups.flatMap((dg) => [
              { kind: "main" as const, datagroup: dg, label: `ชุดที่ ${dg} — รางวัลใหญ่`, visible: visible(liveKey("main", dg)) },
              { kind: "sub" as const, datagroup: dg, label: `ชุดที่ ${dg} — รางวัลย่อย`, visible: visible(liveKey("sub", dg)) },
            ]),
          ]}
        />
      </Card>
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SettingsPageContent />
    </Suspense>
  );
}
