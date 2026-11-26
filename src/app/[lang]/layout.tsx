import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import "../globals.css";
import { getDictionary, isLocale, locales } from "@/lib/i18n";
import { SiteHeader } from "@/components/site/site-header";

const noto = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-thai",
});

export const metadata: Metadata = {
  title: "NURSE GIFT",
  description: "Faculty of Nursing, Chiang Mai University — prize results",
};

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = await getDictionary(lang);

  return (
    <html lang={lang} className={noto.variable}>
      <body className="flex min-h-dvh flex-col">
        <Suspense>
          <SiteHeader lang={lang} t={t} />
        </Suspense>
        <main className="flex-1">{children}</main>
        <footer className="py-6 text-center text-xs leading-relaxed text-stone-500">
          {t.footer_copyright}
          <br />
          {t.footer_credit}
        </footer>
      </body>
    </html>
  );
}
