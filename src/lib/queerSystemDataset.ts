import fs from "fs";
import path from "path";
import Papa from "papaparse";
import {
  QUEER_SYSTEM_COLUMNS,
  QueerSystemRow,
  sanitizeQueerSystemRow,
} from "@/lib/queerSystemSchema";

export type { QueerSystemRow } from "@/lib/queerSystemSchema";

export function queerSystemDatasetPath() {
  return path.join(process.cwd(), "src/data/game_queer_systems.csv");
}

export function readQueerSystemRows(): QueerSystemRow[] {
  const csv = fs.readFileSync(queerSystemDatasetPath(), "utf8");
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
      .map((error) => `linha ${error.row ?? "?"}: ${error.message}`)
      .join("; ");
    throw new Error(`O CSV de sistemas queer é inválido (${details}).`);
  }

  return parsed.data.map(sanitizeQueerSystemRow);
}

export function serializeQueerSystemRows(rows: QueerSystemRow[]) {
  if (rows.length === 0) return `${QUEER_SYSTEM_COLUMNS.join(",")}\n`;

  return `${Papa.unparse(rows, {
    columns: [...QUEER_SYSTEM_COLUMNS],
    newline: "\n",
    header: true,
  })}\n`;
}

export function writeQueerSystemRows(rows: QueerSystemRow[]) {
  const filePath = queerSystemDatasetPath();
  const temporaryPath = `${filePath}.${process.pid}.tmp`;

  fs.writeFileSync(temporaryPath, serializeQueerSystemRows(rows), "utf8");

  try {
    fs.copyFileSync(temporaryPath, filePath);
  } finally {
    fs.rmSync(temporaryPath, { force: true });
  }
}
