export const QUEER_SYSTEM_COLUMNS = [
  "system_id",
  "game_title",
  "release_year",
  "system_type",
  "scope",
  "player_dependency",
  "availability",
  "system_description",
  "limitations",
  "evidence_source",
  "notes",
  "source_language",
  "discovery_source",
  "research_status",
  "evidence_confidence",
  "platform_version",
  "last_reviewed",
] as const;

export const QUEER_SYSTEM_TYPES = [
  "character_creation",
  "gender_customization",
  "pronoun_selection",
  "sexuality_customization",
  "same_gender_romance",
  "gender_independent_romance",
  "same_gender_marriage",
  "queer_family_creation",
  "relationship_system",
  "other",
] as const;

export const QUEER_SYSTEM_SCOPES = [
  "player_avatar",
  "npc",
  "relationships",
  "family",
  "world",
] as const;

export const PLAYER_DEPENDENCIES = ["none", "partial", "full"] as const;

export const SYSTEM_AVAILABILITIES = [
  "default",
  "optional",
  "conditional",
  "expansion",
  "mod_only",
] as const;

export type QueerSystemColumn = (typeof QUEER_SYSTEM_COLUMNS)[number];
export type QueerSystemRow = Record<QueerSystemColumn, string>;

export function createEmptyQueerSystemRow(): QueerSystemRow {
  return Object.fromEntries(
    QUEER_SYSTEM_COLUMNS.map((column) => [column, ""]),
  ) as QueerSystemRow;
}

export function sanitizeQueerSystemRow(value: unknown): QueerSystemRow {
  const source =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const row = createEmptyQueerSystemRow();

  for (const column of QUEER_SYSTEM_COLUMNS) {
    const field = source[column];
    row[column] = typeof field === "string" ? field.trim() : "";
  }

  return row;
}
