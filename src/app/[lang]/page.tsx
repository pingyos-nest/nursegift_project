import Link from "next/link";
import { ArrowRight, Radio, Search } from "lucide-react";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { LiveBadge, PageHero } from "@/components/site/page-hero";

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = await getDictionary(lang);

  const cards = [
    { href: `/${lang}/live`, title: t.index_live_title, desc: t.index_live_desc, live: true, icon: Radio },
    { href: `/${lang}/search`, title: t.index_search_title, desc: t.index_search_desc, live: false, icon: Search },
  ];

  return (
    <>
      <PageHero title={t.index_title_1} subtitle={t.index_title_2} />
      <section className="mx-auto grid max-w-4xl gap-5 px-4 pb-16 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group relative rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-lg"
          >
            {c.live && (
              <span className="absolute right-4 top-4">
                <LiveBadge />
              </span>
            )}
            <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-500 group-hover:text-white">
              <c.icon className="size-6" aria-hidden />
            </span>
            <h2 className="text-lg font-semibold group-hover:text-brand-600">{c.title}</h2>
            <p className="mt-1 flex items-center gap-1 text-stone-600">
              {c.desc}
              <ArrowRight className="size-4 -translate-x-1 text-brand-600 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" aria-hidden />
            </p>
          </Link>
        ))}
      </section>
    </>
  );
}
