import type { Metadata } from "next";
import SiteBetaNotice from "@/components/SiteBetaNotice";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Press Q",
  title: {
    default: "Press Q | AI-Assisted Queer Game Archive",
    template: "%s | Press Q",
  },
  description:
    "Press Q is an AI-Assisted Queer Game Archive guided by Quiu.",
  keywords: [
    "Press Q",
    "Quiu",
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
    title: "Press Q | AI-Assisted Queer Game Archive",
    description:
      "Press Q is an AI-Assisted Queer Game Archive guided by Quiu.",
    siteName: "Press Q",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Press Q | AI-Assisted Queer Game Archive",
    description:
      "Press Q is an AI-Assisted Queer Game Archive guided by Quiu.",
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
