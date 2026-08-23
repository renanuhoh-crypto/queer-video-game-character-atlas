/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");

const inputPath = path.join(__dirname, "../src/data/pressq_seed_dataset.csv");
const outputPath = path.join(__dirname, "../src/data/characters.json");

function toArray(value) {
  if (!value) return [];

  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNumber(value) {
  if (!value) return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

const csv = fs.readFileSync(inputPath, "utf8");
const parsed = Papa.parse(csv, {
  header: true,
  skipEmptyLines: true,
});

if (parsed.errors.length) {
  throw new Error(`Could not parse character CSV: ${parsed.errors[0].message}`);
}

const characters = parsed.data.map((row) => {
  const identityLabels = [
    ...toArray(row.gender),
    ...toArray(row.sexuality),
  ].filter((value) => value && value !== "not_recorded");

  return {
    ...row,
    character_id: row.character_id,
    character_name: row.character_name,
    game_title: row.game_title,
    release_year: toNumber(row.release_year),
    developer: row.developer,
    publisher: row.publisher,
    game_scale: row.game_scale,
    genre: row.genre,
    narrative_role: row.narrative_role,
    playable: row.playable_status === "playable",
    playable_status: row.playable_status,

    identity_label: identityLabels,
    identity_category: toArray(row.identity_category),
    identity_confirmation: row.identity_confirmation,
    queer_status: row.queer_status,

    narrative_centrality_score: toNumber(row.narrative_centrality_score),
    identity_explicitness_score: toNumber(row.identity_explicitness_score),
    player_agency_score: toNumber(row.player_agency_score),
    representation_depth_score: toNumber(row.representation_depth_score),
    stereotype_risk_score: toNumber(row.stereotype_risk_score),
    queer_joy_score: toNumber(row.queer_joy_score),
    total_score: toNumber(row.total_score),

    intersectionality: toArray(row.intersectionality_present),
    intersectionality_present: row.intersectionality_present,
    intersectionality_details: row.intersectionality_details,

    evidence_type: row.evidence_type,
    evidence_source: row.evidence_source,
    notes: row.notes,

    description: row.notes || row.evidence_source || "",
    character_image: row.character_image || "",
    image_credit: row.image_credit || "",
    image_source_url: row.image_source_url || ""
  };
});

fs.writeFileSync(outputPath, JSON.stringify(characters, null, 2));

console.log(`Converted ${characters.length} characters to characters.json`);
