import type { Metadata } from "next";
import RainbowRoadDriveGame from "@/components/RainbowRoadDriveGame";

export const metadata: Metadata = {
  title: "Rainbow Road Wii · Quiu Explorer",
  description: "Continue Quiu's movement-focused journey across the cosmic Rainbow Road Wii stage.",
};

export default function RainbowRoadPage() {
  return <RainbowRoadDriveGame />;
}
