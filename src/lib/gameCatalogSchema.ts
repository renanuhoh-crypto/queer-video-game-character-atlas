export const GAME_CATALOG_COLUMNS = [
  "game_id",
  "game_title",
  "release_year",
  "queer_content_start_year",
  "archive_url",
  "archive_status",
  "source_list_position",
  "notes",
  "last_reviewed",
] as const;

export type GameCatalogColumn = (typeof GAME_CATALOG_COLUMNS)[number];
export type GameCatalogRow = Record<GameCatalogColumn, string>;

export function sanitizeGameCatalogRow(value: unknown): GameCatalogRow {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return Object.fromEntries(
    GAME_CATALOG_COLUMNS.map((column) => [
      column,
      typeof source[column] === "string" ? source[column].trim() : "",
    ]),
  ) as GameCatalogRow;
}
