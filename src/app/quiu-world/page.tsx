import type { Metadata } from "next";
import QuiuWorldGame from "@/components/QuiuWorldGame";

export const metadata: Metadata = {
  title: "Quiu World",
  description:
    "Explore a luminous alien world with Quiu, then cross an animated portal into Rainbow Road Wii.",
};

export default function QuiuWorldPage() {
  return <QuiuWorldGame />;
}
