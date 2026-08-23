import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import Papa from "papaparse";

const SITE = "lgbtqgamearchive.com";
const API_ROOT = `https://public-api.wordpress.com/rest/v1.1/sites/${SITE}/posts`;
const CONCURRENCY = 10;

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

  return String(value ?? "").replace(
    /&(#x?[0-9a-f]+|[a-z]+);/gi,
    (entity, code) => {
      if (code.startsWith("#x")) {
        return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
      }
      if (code.startsWith("#")) {
        return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
      }
      return named[code.toLowerCase()] ?? entity;
    },
  );
}

function plainText(value) {
  return decodeHtml(String(value ?? "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value) {
  return plainText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function canonicalUrl(value) {
  try {
    const url = new URL(String(value).replace(/^http:/, "https:"));
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function apiUrlForArchiveUrl(value) {
  const url = new URL(value);
  const id = url.searchParams.get("page_id") || url.searchParams.get("p");
  if (id && /^\d+$/.test(id)) return `${API_ROOT}/${id}`;

  const slug = url.pathname.split("/").filter(Boolean).at(-1);
  return slug ? `${API_ROOT}/slug:${encodeURIComponent(slug)}` : "";
}

async function fetchArchivePage(value) {
  const apiUrl = apiUrlForArchiveUrl(value);
  if (!apiUrl) return { error: "Archive URL has no resolvable post or page." };

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) return { error: `HTTP ${response.status}` };
    return await response.json();
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Request failed." };
  }
}

async function mapConcurrent(items, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, () => worker()),
  );
  return results;
}

function referenceSection(content) {
  const start = content.search(/LGBTQ(?:\+)?[\s\S]{0,160}?References/i);
  if (start < 0) return "";
  const tail = content.slice(start);
  const end = tail.search(/<p[^>]*>\s*<(?:strong|b)>\s*Citations?\s*:/i);
  return end >= 0 ? tail.slice(0, end) : tail.slice(0, 10000);
}

function extractReferenceLinks(content, parentUrl) {
  const section = referenceSection(content);
  const links = [];
  const pattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = pattern.exec(section))) {
    const url = canonicalUrl(decodeHtml(match[1]));
    const label = plainText(match[2]);
    if (!url || !label || normalize(label) === "this game") continue;
    if (!new URL(url).hostname.endsWith(SITE)) continue;
    if (canonicalUrl(parentUrl) === url) continue;
    links.push({ label, url });
  }

  return links;
}

const nonCharacterPattern = new RegExp(
  [
    "ambient",
    "ally support",
    "character creation",
    "cross.?dress",
    "game narrative",
    "game series",
    "gender options",
    "homophobia",
    "marriage",
    "pronouns?",
    "queer narrative",
    "relationships?",
    "romance options?",
    "same.?sex",
    "sexuality options?",
    "this game series",
    "this series",
    "transphobia",
    "yaoi",
    "yuri",
  ].join("|"),
  "i",
);

function classify(label, detailTitle, categories) {
  const combined = `${label} ${detailTitle}`;
  const categoryText = categories.join("; ");
  if (
    nonCharacterPattern.test(combined) ||
    categories.includes("Real Person") ||
    categories.includes("Locations") ||
    categories.includes("Artifacts") ||
    (categories.includes("Non-binary Gender Customization") &&
      !categories.some((category) => /(?:explicit|implicit)/i.test(category)))
  ) {
    return "non_character_reference";
  }
  if (/Queerly Read\/Rumored/i.test(categoryText)) {
    return "queer_reading_candidate";
  }
  if (
    /Characters|Queer Men|Queer Women|Transgender|Non-binary|Genderqueer|Intersex|Asexual|Bisexual|Gay|Lesbian|Pansexual/i.test(
      categoryText,
    )
  ) {
    return "character_candidate";
  }
  return "needs_unit_review";
}

const cwd = process.cwd();
const catalogPath = path.join(cwd, "src", "data", "lgbtq_game_catalog.csv");
const charactersPath = path.join(cwd, "src", "data", "pressq_seed_dataset.csv");
const outputPath = path.join(cwd, "src", "data", "lgbtq_archive_link_audit.csv");

const [catalogCsv, charactersCsv] = await Promise.all([
  readFile(catalogPath, "utf8"),
  readFile(charactersPath, "utf8"),
]);
const catalog = Papa.parse(catalogCsv, { header: true, skipEmptyLines: true }).data;
const characters = Papa.parse(charactersCsv, {
  header: true,
  skipEmptyLines: true,
}).data;
const registeredNames = new Set(characters.map((row) => normalize(row.character_name)));
const registeredEvidence = characters
  .flatMap((row) => String(row.evidence_source ?? "").match(/https?:\/\/[^\s]+/g) ?? [])
  .map(canonicalUrl);

const parentGroups = new Map();
for (const game of catalog) {
  if (!game.archive_url) continue;
  const url = canonicalUrl(game.archive_url);
  const group = parentGroups.get(url) ?? { url, games: [] };
  group.games.push(game);
  parentGroups.set(url, group);
}

const parents = [...parentGroups.values()];
const parentPages = await mapConcurrent(parents, async (parent) => ({
  parent,
  page: await fetchArchivePage(parent.url),
}));

const references = new Map();
for (const { parent, page } of parentPages) {
  for (const link of extractReferenceLinks(page.content ?? "", parent.url)) {
    const entry = references.get(link.url) ?? {
      referenceUrl: link.url,
      labels: new Set(),
      games: new Map(),
    };
    entry.labels.add(link.label);
    for (const game of parent.games) {
      entry.games.set(`${normalize(game.game_title)}|${game.release_year}`, game);
    }
    references.set(link.url, entry);
  }
}

const detailEntries = [...references.values()];
const detailPages = await mapConcurrent(detailEntries, async (entry) => ({
  entry,
  page: await fetchArchivePage(entry.referenceUrl),
}));

const reviewed = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Toronto",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

const audit = detailPages.map(({ entry, page }) => {
  const label = [...entry.labels].sort((a, b) => a.localeCompare(b)).join("; ");
  const games = [...entry.games.values()].sort(
    (a, b) => Number(a.release_year) - Number(b.release_year),
  );
  const detailTitle = plainText(page.title ?? "");
  const categories = Object.keys(page.categories ?? {}).sort((a, b) =>
    a.localeCompare(b),
  );
  const classification = page.error
    ? "unavailable"
    : classify(label, detailTitle, categories);
  const alreadyRegistered =
    [...entry.labels].some((name) => registeredNames.has(normalize(name))) ||
    registeredEvidence.includes(canonicalUrl(entry.referenceUrl));

  return {
    reference_label: label,
    parent_game_titles: games.map((game) => game.game_title).join("; "),
    parent_release_years: games.map((game) => game.release_year).join("; "),
    reference_url: entry.referenceUrl,
    reference_page_title: detailTitle,
    category_names: categories.join("; "),
    classification,
    already_registered: alreadyRegistered ? "yes" : "no",
    review_status: alreadyRegistered
      ? "already_registered"
      : classification === "character_candidate"
        ? "needs_character_review"
        : classification,
    source_excerpt: plainText(page.content ?? "").slice(0, 900),
    request_error: page.error ?? "",
    last_reviewed: reviewed,
  };
});

audit.sort(
  (a, b) =>
    Number(a.parent_release_years.split(";")[0]) -
      Number(b.parent_release_years.split(";")[0]) ||
    a.reference_label.localeCompare(b.reference_label),
);

await writeFile(outputPath, Papa.unparse(audit, { newline: "\n" }) + "\n", "utf8");

const summary = audit.reduce(
  (counts, row) => {
    counts[row.review_status] = (counts[row.review_status] ?? 0) + 1;
    return counts;
  },
  {},
);

console.log(
  JSON.stringify(
    {
      researchedCatalogGames: catalog.filter(
        (row) => row.archive_status === "researched",
      ).length,
      linkedCatalogGames: catalog.filter((row) => row.archive_url).length,
      uniqueParentPages: parents.length,
      linkedReferencePages: audit.length,
      ...summary,
      outputPath,
    },
    null,
    2,
  ),
);
