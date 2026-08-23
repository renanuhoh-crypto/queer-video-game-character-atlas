import { writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_URL =
  "https://public-api.wordpress.com/rest/v1.1/sites/lgbtqgamearchive.com/posts/slug:full-game-list";

function decodeHtml(value) {
  const named = {
    amp: "&",
    apos: "'",
    gt: ">",
    hellip: "…",
    ldquo: "“",
    lsquo: "‘",
    lt: "<",
    nbsp: " ",
    ndash: "–",
    quot: '"',
    rdquo: "”",
    rsquo: "’",
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code) => {
    if (code.startsWith("#x")) return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    if (code.startsWith("#")) return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    return named[code.toLowerCase()] ?? entity;
  });
}

function plainText(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function csv(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function normalizeTitle(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

const response = await fetch(SOURCE_URL);
if (!response.ok) throw new Error(`Archive request failed: ${response.status}`);
const payload = await response.json();
const html = payload.content;

const sectionPattern = /<h2[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2[^>]*>|$)/gi;
const candidates = [];
let section;

while ((section = sectionPattern.exec(html))) {
  const yearMatch = plainText(section[1]).match(/\b(19|20)\d{2}\b/);
  if (!yearMatch) continue;
  const releaseYear = Number(yearMatch[0]);
  const itemPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let item;

  while ((item = itemPattern.exec(section[2]))) {
    const itemHtml = item[1];
    const originalText = plainText(itemHtml);
    const explicitReleaseMatch = originalText.match(/\(((?:19|20)\d{2})\b/);
    const itemReleaseYear = explicitReleaseMatch
      ? Number(explicitReleaseMatch[1])
      : releaseYear;
    const linkMatch = itemHtml.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/i);
    const archiveUrl = linkMatch ? decodeHtml(linkMatch[1]).replace(/^http:/, "https:") : "";
    const needsResearch = !archiveUrl || /\^/.test(originalText);
    const contentStartMatch = originalText.match(/content began in\s+((?:19|20)\d{2})/i);

    const gameTitle = originalText
      .replace(/\s*\((?:19|20)\d{2}(?:[^)]*)\)\s*\^?\s*$/i, "")
      .replace(/\s+(?:19|20)\d{2}\s*[\^*]?\s*$/i, "")
      .replace(/\s*[\^*]\s*$/i, "")
      .trim();

    if (!gameTitle) continue;
    candidates.push({
      gameTitle,
      releaseYear: itemReleaseYear,
      queerContentStartYear: contentStartMatch
        ? Number(contentStartMatch[1])
        : itemReleaseYear,
      archiveUrl,
      archiveStatus: needsResearch ? "needs_research" : "researched",
      sourcePosition: candidates.length + 1,
      notes: needsResearch
        ? archiveUrl
          ? "Marked with ^ by the source list."
          : "No dedicated archive link; source indicates research is still needed."
        : "",
    });
  }
}

const unique = new Map();
for (const candidate of candidates) {
  const key = `${normalizeTitle(candidate.gameTitle)}|${candidate.releaseYear}`;
  const previous = unique.get(key);
  if (!previous) {
    unique.set(key, candidate);
    continue;
  }

  const preferred = candidate.releaseYear < previous.releaseYear ? candidate : previous;
  const duplicatePositions = [previous.sourcePosition, candidate.sourcePosition]
    .sort((a, b) => a - b)
    .join("; ");
  unique.set(key, {
    ...preferred,
    archiveUrl: preferred.archiveUrl || previous.archiveUrl || candidate.archiveUrl,
    archiveStatus:
      previous.archiveStatus === "researched" || candidate.archiveStatus === "researched"
        ? "researched"
        : "needs_research",
    queerContentStartYear: Math.max(
      previous.queerContentStartYear,
      candidate.queerContentStartYear,
    ),
    notes: `Duplicate source-list entries consolidated (positions ${duplicatePositions}).`,
  });
}

const rows = [...unique.values()].sort(
  (a, b) => a.releaseYear - b.releaseYear || a.sourcePosition - b.sourcePosition,
);
const header = [
  "game_id",
  "game_title",
  "release_year",
  "queer_content_start_year",
  "archive_url",
  "archive_status",
  "source_list_position",
  "notes",
  "last_reviewed",
];
const reviewed = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Toronto",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const output = [
  header.join(","),
  ...rows.map((row, index) =>
    [
      index + 1,
      row.gameTitle,
      row.releaseYear,
      row.queerContentStartYear,
      row.archiveUrl,
      row.archiveStatus,
      row.sourcePosition,
      row.notes,
      reviewed,
    ]
      .map(csv)
      .join(","),
  ),
].join("\n");

const target = path.join(process.cwd(), "src", "data", "lgbtq_game_catalog.csv");
await writeFile(target, `${output}\n`, "utf8");

const researched = rows.filter((row) => row.archiveStatus === "researched").length;
console.log(
  JSON.stringify(
    {
      sourceEntries: candidates.length,
      uniqueGames: rows.length,
      duplicatesConsolidated: candidates.length - rows.length,
      researched,
      needsResearch: rows.length - researched,
      target,
    },
    null,
    2,
  ),
);
