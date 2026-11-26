import { Suspense } from "react";
import PageSkeleton from "../loading";
import { requireAdmin } from "@/lib/auth/guard";
import { getLanguageRows } from "@/lib/data/admin";
import { fallback } from "@/lib/i18n/fallback";
import { PageHeader } from "@/components/admin/layout-bits";
import { LanguageEditor } from "./language-editor";

export const metadata = { title: "จัดการภาษา" };

const SECTIONS = [
  { name: "Navbar", path: "", keys: ["nav_home", "nav_live", "nav_search"] },
  { name: "Index Page", path: "", keys: ["index_title_1", "index_title_2", "index_live_title", "index_live_desc", "index_search_title", "index_search_desc"] },
  { name: "Live Page", path: "/live", keys: ["live_title", "live_status_connected", "live_status_disconnected", "live_status_reconnecting", "live_error_title", "live_error_desc", "live_retry", "live_empty_title", "live_empty_desc", "live_new_badge", "live_main", "live_sub", "live_set"] },
  { name: "Search Page", path: "/search", keys: ["search_header_title", "search_header_subtitle", "search_card_title", "search_placeholder", "search_button", "search_tips_title", "search_tips_desc", "search_result_success_title", "search_result_notfound_title", "search_warning_min_chars", "search_error_generic", "search_error_connection"] },
  { name: "Footer", path: "", keys: ["footer_copyright", "footer_credit"] },
];

async function LanguagePageContent({ searchParams }: PageProps<"/admin/language">) {
  await requireAdmin();
  const code = (await searchParams).lang === "en" ? "en" : "th";
  const db = await getLanguageRows(code);
  const values = Object.fromEntries(Object.keys(fallback[code]).map((k) => [k, db[k] ?? fallback[code][k as keyof typeof fallback.th]]));

  return (
    <>
      <PageHeader title="จัดการภาษา" subtitle="Language Management for the public site" />
      <LanguageEditor key={code} code={code} sections={SECTIONS} initial={values} />
    </>
  );
}

export default function LanguagePage(props: PageProps<"/admin/language">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LanguagePageContent {...props} />
    </Suspense>
  );
}
