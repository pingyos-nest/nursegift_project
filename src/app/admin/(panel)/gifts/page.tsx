import { Suspense } from "react";
import PageSkeleton from "../loading";
import { getCurrentUser } from "@/lib/auth/guard";
import { countWinners, getAllGifts, getGroups } from "@/lib/data/admin";
import { PageHeader } from "@/components/admin/layout-bits";
import { GiftManager } from "./gift-manager";

export const metadata = { title: "จัดการของรางวัล" };

async function GiftsPageContent() {
  await getCurrentUser();
  const [mainGifts, subGifts, groups, mainWinners, subWinners] = await Promise.all([
    getAllGifts("main"), getAllGifts("sub"), getGroups(), countWinners("main"), countWinners("sub"),
  ]);

  return (
    <>
      <PageHeader title="จัดการของรางวัล" subtitle="Manage Prizes and Categories" />
      <GiftManager kind="main" gifts={mainGifts} groups={groups} winners={mainWinners} />
      <div className="h-8" />
      <GiftManager kind="sub" gifts={subGifts} groups={groups} winners={subWinners} />
    </>
  );
}

export default function GiftsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <GiftsPageContent />
    </Suspense>
  );
}
