import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "src/data/atlas_seed_dataset.csv");
  const csv = fs.readFileSync(filePath, "utf8");

  const lines = csv.trim().split(/\r?\n/);
  const headers = splitCSVLine(lines[0]);

  const characters = lines.slice(1).map((line) => {
    const values = splitCSVLine(line);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || "";
    });

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
      identity_label: toArray(row.identity_label),
      identity_confirmation: row.identity_confirmation,
      queer_status: row.queer_status,
      total_score: toNumber(row.total_score),
      queer_joy_score: toNumber(row.queer_joy_score),
      intersectionality: toArray(row.intersectionality_present),
      intersectionality_present: row.intersectionality_present,
      intersectionality_details: row.intersectionality_details,
      evidence_type: row.evidence_type,
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

function splitCSVLine(line: string) {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (const char of line) {
    if (char === '"') insideQuotes = !insideQuotes;
    else if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
    } else current += char;
  }

  result.push(current);
  return result;
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
