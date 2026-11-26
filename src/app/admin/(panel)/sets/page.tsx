import { Suspense } from "react";
import PageSkeleton from "../loading";
import { PrizeSetList } from "@/components/admin/prize-sets";

export const metadata = { title: "ชุดรางวัล" };

export default function SetsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PrizeSetList />
    </Suspense>
  );
}
