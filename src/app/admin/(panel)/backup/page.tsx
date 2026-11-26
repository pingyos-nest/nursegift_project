import { Suspense } from "react";
import PageSkeleton from "../loading";
import { DatabaseBackup, Download, Gift, Layers, Trophy, Upload, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth/guard";
import { getBackupCounts } from "@/lib/data/admin";
import { Card, PageHeader, Stat } from "@/components/admin/layout-bits";
import { RestoreForm } from "./restore-form";
import { withBase } from "@/lib/base-path";

export const metadata = { title: "สำรองข้อมูล" };

async function BackupPageContent() {
  await requireAdmin();
  const c = await getBackupCounts();
  return (
    <>
      <PageHeader title="สำรองและกู้คืนข้อมูล" subtitle="Backup & Restore" />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="ชุดรางวัล" value={c.groups} icon={Layers} />
        <Stat label="ของรางวัล(ใหญ่)" value={c.gifts} tone="brand" icon={Trophy} />
        <Stat label="ผู้โชคดี(ใหญ่)" value={c.winners} tone="green" icon={Users} />
        <Stat label="ของรางวัล(ย่อย)" value={c.subGifts} tone="sky" icon={Gift} />
        <Stat label="ผู้โชคดี(ย่อย)" value={c.subWinners} tone="green" icon={Users} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title={<span className="flex items-center gap-2"><DatabaseBackup className="size-5 text-brand-600" aria-hidden />สำรองข้อมูล (Backup)</span>}>
          <p className="mb-4 text-sm text-stone-600">ดาวน์โหลดไฟล์สำรองข้อมูลทั้งหมดในรูปแบบ JSON (รูปแบบเดียวกับระบบ PHP เดิม และเพิ่มรางวัลย่อย)</p>
          <a href={withBase("/admin/backup/download")} className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"><Download className="size-4" aria-hidden />ดาวน์โหลดไฟล์สำรอง</a>
        </Card>
        <Card title={<span className="flex items-center gap-2"><Upload className="size-5 text-red-600" aria-hidden />กู้คืนข้อมูล (Restore)</span>}>
          <p className="mb-4 text-sm text-red-600">อัปโหลดไฟล์สำรองเพื่อกู้คืนข้อมูล — ข้อมูลปัจจุบันจะถูกลบ! (รางวัลย่อยจะถูกแทนที่เฉพาะเมื่อไฟล์มีข้อมูลรางวัลย่อย)</p>
          <RestoreForm />
        </Card>
      </div>
    </>
  );
}

export default function BackupPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BackupPageContent />
    </Suspense>
  );
}
