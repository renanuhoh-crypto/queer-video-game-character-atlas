import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat with Quiu",
  description:
    "Ask Quiu questions grounded in the Press Q dataset about queer video game representation.",
};

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
