import { NextResponse } from "next/server";
import { readQueerReadingRows } from "@/lib/queerReadingDataset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const readings = readQueerReadingRows().map((reading) => {
    const { source_language, ...publicReading } = reading;
    void source_language;

    return {
      ...publicReading,
      unit_type: "queer_reading" as const,
      release_year: reading.release_year
        ? Number.parseInt(reading.release_year, 10)
        : null,
    };
  });

  return NextResponse.json({ readings });
}
