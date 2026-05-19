import type { Metadata } from "next";
import SiteBetaNotice from "@/components/SiteBetaNotice";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRSM",
  description: "AI-assisted archive of queer game representation",
  keywords: [
    "queer games",
    "video game representation",
    "digital humanities",
    "queer characters",
    "game studies",
    "AI archive",
    "intersectionality",
    "LGBTQ games",
    "representation analytics",
  ],

  openGraph: {
    title: "PRSM",
    description:
      "AI-assisted archive of queer game representation",
    siteName: "PRSM",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "PRSM",
    description:
      "AI-assisted archive of queer game representation",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#05010f] text-white antialiased">
        <SiteBetaNotice />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
