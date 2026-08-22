import type { Metadata } from "next";
import RainbowRoadTimeline from "@/components/RainbowRoadTimeline";

export const metadata: Metadata = {
  title: "Rainbow Road",
  description: "Explore the growth of documented queer video game characters across release years with Quiu.",
};

export default function RainbowRoadPage() {
  return <RainbowRoadTimeline />;
}
