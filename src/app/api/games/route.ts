import { NextResponse } from "next/server";
import { readGameCatalogRows } from "@/lib/gameCatalogDataset";

function toNumber(value: string) {
  const number = Number(value);
  return value && Number.isFinite(number) ? number : null;
}

export async function GET() {
  const games = readGameCatalogRows().map((row) => ({
    game_id: row.game_id,
    game_title: row.game_title,
    release_year: toNumber(row.release_year),
    queer_content_start_year: toNumber(row.queer_content_start_year),
    archive_url: row.archive_url,
    archive_status: row.archive_status,
    source_list_position: toNumber(row.source_list_position),
    notes: row.notes,
    last_reviewed: row.last_reviewed,
  }));

  return NextResponse.json({ games });
}
