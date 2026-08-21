import fs from "fs";
import path from "path";
import Papa from "papaparse";
import {
  CHARACTER_COLUMNS,
  CharacterRow,
  sanitizeCharacterRow,
} from "@/lib/characterSchema";

export type { CharacterRow } from "@/lib/characterSchema";

export function characterDatasetPath() {
  return path.join(process.cwd(), "src/data/pressq_seed_dataset.csv");
}

export function readCharacterRows(): CharacterRow[] {
  const csv = fs.readFileSync(characterDatasetPath(), "utf8");
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.replace(/^\uFEFF/, "").trim(),
  });

  const blockingErrors = parsed.errors.filter(
    (error) => error.code !== "TooFewFields",
  );

  if (blockingErrors.length > 0) {
    const details = blockingErrors
      .slice(0, 3)
      .map((error) => `row ${error.row ?? "?"}: ${error.message}`)
      .join("; ");
    throw new Error(`The character CSV is invalid (${details}).`);
  }

  return parsed.data.map(sanitizeCharacterRow);
}

export function serializeCharacterRows(rows: CharacterRow[]) {
  if (rows.length === 0) return `${CHARACTER_COLUMNS.join(",")}\n`;

  return `${Papa.unparse(rows, {
    columns: [...CHARACTER_COLUMNS],
    newline: "\n",
    header: true,
  })}\n`;
}

export function writeCharacterRows(rows: CharacterRow[]) {
  const filePath = characterDatasetPath();
  const temporaryPath = `${filePath}.${process.pid}.tmp`;

  fs.writeFileSync(temporaryPath, serializeCharacterRows(rows), "utf8");

  try {
    fs.copyFileSync(temporaryPath, filePath);
  } finally {
    fs.rmSync(temporaryPath, { force: true });
  }
}
