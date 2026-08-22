import fs from "fs";
import path from "path";
import Papa from "papaparse";
import {
  QUEER_READING_COLUMNS,
  QueerReadingRow,
  sanitizeQueerReadingRow,
} from "@/lib/queerReadingSchema";

export type { QueerReadingRow } from "@/lib/queerReadingSchema";

export function queerReadingDatasetPath() {
  return path.join(process.cwd(), "src/data/queer_readings.csv");
}

export function readQueerReadingRows(): QueerReadingRow[] {
  const csv = fs.readFileSync(queerReadingDatasetPath(), "utf8");
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
    throw new Error(`The queer readings CSV is invalid (${details}).`);
  }

  return parsed.data.map(sanitizeQueerReadingRow);
}

export function serializeQueerReadingRows(rows: QueerReadingRow[]) {
  if (rows.length === 0) return `${QUEER_READING_COLUMNS.join(",")}\n`;

  return `${Papa.unparse(rows, {
    columns: [...QUEER_READING_COLUMNS],
    newline: "\n",
    header: true,
  })}\n`;
}
