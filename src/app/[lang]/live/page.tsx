import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { LiveBadge, PageHero } from "@/components/site/page-hero";
import { Clock } from "@/components/site/clock";
import { LiveFeed } from "./live-feed";

export default async function LivePage({ params }: PageProps<"/[lang]/live">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = await getDictionary(lang);

  return (
    <>
      <PageHero title={t.live_title}>
        <div className="mt-4"><LiveBadge /></div>
        <Clock />
      </PageHero>
      <LiveFeed t={t} lang={lang} />
    </>
  );
}
