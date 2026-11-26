import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { PageHero } from "@/components/site/page-hero";
import { Clock } from "@/components/site/clock";
import { SearchBox } from "./search-box";

export default async function SearchPage({ params }: PageProps<"/[lang]/search">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = await getDictionary(lang);

  return (
    <>
      <PageHero title={t.search_header_title} subtitle={t.search_header_subtitle}>
        <Clock />
      </PageHero>
      <SearchBox t={t} />
    </>
  );
}
