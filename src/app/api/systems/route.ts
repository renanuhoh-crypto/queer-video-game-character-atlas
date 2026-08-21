import { NextResponse } from "next/server";
import { readQueerSystemRows } from "@/lib/queerSystemDataset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const systems = readQueerSystemRows().map((system) => ({
    ...system,
    unit_type: "game_system" as const,
    release_year: system.release_year
      ? Number.parseInt(system.release_year, 10)
      : null,
  }));

  return NextResponse.json({ systems });
}
