const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "../src/data/atlas_seed_dataset.csv");
const outputPath = path.join(__dirname, "../src/data/characters.json");

function splitCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let char of line) {
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

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
const lines = csv.trim().split(/\r?\n/);

const headers = splitCSVLine(lines[0]);

const characters = lines.slice(1).map((line) => {
  const values = splitCSVLine(line);
  const row = {};

  headers.forEach((header, index) => {
    row[header] = values[index] || "";
  });

  return {
    character_id: row.character_id,
    character_name: row.character_name,
    game_title: row.game_title,
    release_year: toNumber(row.release_year),
    developer: row.developer,
    game_scale: row.game_scale,
    genre: row.genre,
    narrative_role: row.narrative_role,
    playable: row.playable_status === "playable",
    playable_status: row.playable_status,

    identity_label: toArray(row.identity_label),
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
    character_image: row.character_image || ""
  };
});

fs.writeFileSync(outputPath, JSON.stringify(characters, null, 2));

console.log(`Converted ${characters.length} characters to characters.json`);