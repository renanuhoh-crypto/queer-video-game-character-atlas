import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Queer Video Game Character Atlas",
  description:
    "AI-assisted archive for queer video game characters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}