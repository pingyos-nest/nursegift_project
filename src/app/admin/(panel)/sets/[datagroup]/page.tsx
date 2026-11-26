import { Suspense } from "react";
import PageSkeleton from "../../loading";
import { PrizeSetBoard } from "@/components/admin/prize-sets";

export const metadata = { title: "ชุดรางวัล" };

export default function SetBoardPage({ params, searchParams }: PageProps<"/admin/sets/[datagroup]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PrizeSetBoard params={params} searchParams={searchParams} />
    </Suspense>
  );
}
