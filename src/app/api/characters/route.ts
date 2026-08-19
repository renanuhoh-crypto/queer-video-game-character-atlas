import { NextResponse } from "next/server";
import { readCharacterRows } from "@/lib/characterDataset";

export async function GET() {
  const characters = readCharacterRows().map((row) => {
    return {
      character_id: row.character_id,
      character_name: row.character_name,
      game_title: row.game_title,
      release_year: toNumber(row.release_year),
      developer: row.developer,
      genre: row.genre,
      narrative_role: row.narrative_role,
      playable: row.playable_status === "playable",
      playable_status: row.playable_status,
      gender: row.gender,
      sexuality: row.sexuality,
      identity_category: toArray(row.identity_category),
      identity_label: [row.gender, row.sexuality].filter(Boolean),
      identity_confirmation: row.identity_confirmation,
      queer_status: row.queer_status,
      total_score: null,
      queer_joy_score: null,
      intersectionality: toArray(row.intersectionality_present),
      intersectionality_present: row.intersectionality_present,
      intersectionality_details: row.intersectionality_details,
      evidence_type: "",
      evidence_source: row.evidence_source,
      notes: row.notes,
      description: row.notes || row.evidence_source || "",
      character_image: row.character_image || "",
      image_credit: row.image_credit || "",
      image_source_url: row.image_source_url || "",
    };
  });

  return NextResponse.json({ characters });
}

function toArray(value: string) {
  if (!value) return [];

  return value
    .split(";")
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNumber(value: string) {
  if (!value) return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}
