export const QUEER_READING_COLUMNS = [
  "reading_id",
  "game_title",
  "release_year",
  "subject",
  "subject_type",
  "reading_type",
  "reading_status",
  "reading_summary",
  "counterevidence",
  "evidence_source",
  "notes",
  "source_language",
  "discovery_source",
  "research_status",
  "evidence_confidence",
  "platform_version",
  "last_reviewed",
] as const;

export const QUEER_READING_TYPES = [
  "gender_identity",
  "sexuality",
  "gender_expression",
  "queer_theme",
] as const;

export const QUEER_READING_STATUSES = [
  "queerly_read",
  "contested",
  "creator_refuted",
] as const;

export type QueerReadingColumn = (typeof QUEER_READING_COLUMNS)[number];
export type QueerReadingRow = Record<QueerReadingColumn, string>;

export function createEmptyQueerReadingRow(): QueerReadingRow {
  return Object.fromEntries(
    QUEER_READING_COLUMNS.map((column) => [column, ""]),
  ) as QueerReadingRow;
}

export function sanitizeQueerReadingRow(value: unknown): QueerReadingRow {
  const source =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const row = createEmptyQueerReadingRow();

  for (const column of QUEER_READING_COLUMNS) {
    const field = source[column];
    row[column] = typeof field === "string" ? field.trim() : "";
  }

  return row;
}
