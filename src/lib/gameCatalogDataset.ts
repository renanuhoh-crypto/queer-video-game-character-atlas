import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { GameCatalogRow, sanitizeGameCatalogRow } from "@/lib/gameCatalogSchema";

export function gameCatalogDatasetPath() {
  return path.join(process.cwd(), "src/data/lgbtq_game_catalog.csv");
}

export function readGameCatalogRows(): GameCatalogRow[] {
  const source = fs.readFileSync(gameCatalogDatasetPath(), "utf8");
  const parsed = Papa.parse<Record<string, string>>(source, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.replace(/^\uFEFF/, "").trim(),
  });

  const blockingErrors = parsed.errors.filter((error) => error.code !== "TooFewFields");
  if (blockingErrors.length > 0) {
    throw new Error(`The game catalog CSV is invalid (${blockingErrors[0].message}).`);
  }

  return parsed.data.map(sanitizeGameCatalogRow);
}
