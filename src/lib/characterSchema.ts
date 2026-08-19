export const CHARACTER_COLUMNS = [
  "character_id",
  "character_name",
  "game_title",
  "release_year",
  "developer",
  "publisher",
  "game_scale",
  "genre",
  "narrative_role",
  "playable_status",
  "gender",
  "sexuality",
  "identity_category",
  "identity_confirmation",
  "queer_status",
  "intersectionality_present",
  "intersectionality_details",
  "evidence_source",
  "notes",
  "character_image",
  "image_credit",
  "image_source_url",
] as const;

export type CharacterColumn = (typeof CHARACTER_COLUMNS)[number];
export type CharacterRow = Record<CharacterColumn, string>;

export function createEmptyCharacterRow(): CharacterRow {
  return Object.fromEntries(
    CHARACTER_COLUMNS.map((column) => [column, ""]),
  ) as CharacterRow;
}

export function sanitizeCharacterRow(value: unknown): CharacterRow {
  const source =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const row = createEmptyCharacterRow();

  for (const column of CHARACTER_COLUMNS) {
    const field = source[column];
    row[column] = typeof field === "string" ? field.trim() : "";
  }

  return row;
}
