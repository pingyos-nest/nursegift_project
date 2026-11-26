import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "../globals.css";

const noto = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-thai",
});

export const metadata: Metadata = {
  title: { default: "Admin — NURSE GIFT", template: "%s — NURSE GIFT Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="th" className={noto.variable}>
      <body className="min-h-dvh bg-stone-100">{children}</body>
    </html>
  );
}
