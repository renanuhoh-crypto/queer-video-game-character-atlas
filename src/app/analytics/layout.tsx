import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics",
  description:
    "Explore patterns and representation across the Press Q dataset.",
};

export default function AnalyticsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
