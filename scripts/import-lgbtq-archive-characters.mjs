import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import Papa from "papaparse";

const shouldWrite = process.argv.includes("--write");

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

function cleanText(value) {
  return decodeHtml(value).replace(/\s+/g, " ").trim();
}

function normalize(value) {
  return cleanText(value)
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

function list(value) {
  return String(value ?? "")
    .split(";")
    .map((item) => cleanText(item))
    .filter(Boolean);
}

function titleSubject(row) {
  const title = cleanText(row.reference_page_title);
  const connectorMatch = title.match(/\s+(?:in|from)\s+.+$/i);
  if (connectorMatch) return title.slice(0, connectorMatch.index).trim();

  const parentTitles = list(row.parent_game_titles).sort(
    (a, b) => b.length - a.length,
  );
  for (const gameTitle of parentTitles) {
    const index = title.toLowerCase().lastIndexOf(gameTitle.toLowerCase());
    if (index > 0 && index + gameTitle.length === title.length) {
      return title.slice(0, index).replace(/[,:–—-]+\s*$/, "").trim();
    }
  }
  return cleanText(row.reference_label);
}

const groupPattern = new RegExp(
  [
    "actions?",
    "asari",
    "bonus dates",
    "brute splicers",
    "brothers?",
    "buoyant armigers",
    "characters?",
    "couples?",
    "dads?",
    "denizens?",
    "family",
    "firemen",
    "game narrative",
    "gay ending",
    "gay jokes",
    "gay villains",
    "groups?",
    "his dates",
    "lgb love",
    "lgbt media",
    "magypsies",
    "marriage",
    "mentions?",
    "mission",
    "npcs?",
    "non.byleth pairings",
    "options?",
    "parents?",
    "pronouns?",
    "queer narrative",
    "queerness",
    "relationships?",
    "romance",
    "sex workers?",
    "sexuality",
    "sexual development",
    "sisters?",
    "the divas",
    "the argonians",
    "the star crossed lovers",
    "vessels?",
    "wedding",
    "women.on.women",
  ].join("|"),
  "i",
);

function splitSubjects(row) {
  const subject = titleSubject(row)
    .replace(/^[“\"]?Bad Ending[”\"]?\s+with\s+/i, "")
    .replace(/^Alliance Pilot\s+/i, "")
    .replace(/^Comm Specialist,?\s*/i, "")
    .replace(/,?\s+Mass Effect 3\s*[–—-].*$/i, "")
    .replace(/\s+\((?:19|20)\d{2}\)\s*$/, "")
    .trim();
  if (!subject || groupPattern.test(subject)) return [];
  if (/\//.test(subject)) return [subject];
  return subject
    .split(/\s+(?:and|&)\s+/i)
    .map((name) => name.trim())
    .filter((name) => name && !groupPattern.test(name));
}

function deriveGame(row, catalog) {
  const sourceOverrides = {
    "https://lgbtqgamearchive.com/?p=12604": {
      title: "Fire Emblem: Rekka no Ken",
      year: "2003",
    },
    "https://lgbtqgamearchive.com?p=12604": {
      title: "Fire Emblem: Rekka no Ken",
      year: "2003",
    },
    "https://lgbtqgamearchive.com/2015/08/28/reaver-in-fable-series": {
      title: "Fable II",
      year: "2008",
    },
    "https://lgbtqgamearchive.com/2015/10/30/lieutenant-commander-kaidan-alenko": {
      title: "Mass Effect 3",
      year: "2012",
    },
    "https://lgbtqgamearchive.com/2015/11/20/leo-in-tekken-series": {
      title: "Tekken 6",
      year: "2007",
    },
  };
  const override = sourceOverrides[canonicalUrl(row.reference_url)];
  if (override) return override;

  const parentTitles = list(row.parent_game_titles);
  const parentYears = list(row.parent_release_years);
  const parents = parentTitles.map((title, index) => ({
    title,
    year: parentYears[index] ?? "",
  }));
  const titleText = normalize(row.reference_page_title);
  const excerptText = normalize(row.source_excerpt).slice(0, 1200);
  const suffix = cleanText(row.reference_page_title).match(/\s+(?:in|from)\s+(.+)$/i)?.[1];
  if (suffix) {
    const exact = catalog.find((game) => normalize(game.game_title) === normalize(suffix));
    if (exact) return { title: exact.game_title, year: exact.release_year };

    const baseMatches = parents.filter((game) =>
      normalize(suffix).startsWith(normalize(game.title)),
    );
    if (baseMatches.length > 1) {
      const latest = [...baseMatches].sort((a, b) => Number(b.year) - Number(a.year))[0];
      return { title: suffix, year: latest.year };
    }
  }

  const titleMatching = parents
    .filter((game) => {
      const key = normalize(game.title);
      return titleText.includes(key);
    })
    .sort((a, b) => normalize(b.title).length - normalize(a.title).length);
  if (titleMatching.length) return titleMatching[0];

  const fuzzyTitleMatching = parents
    .filter((game) => {
      const tail = normalize(game.title.split(":").at(-1));
      return tail.length >= 6 && titleText.includes(tail);
    })
    .sort((a, b) => normalize(b.title).length - normalize(a.title).length);
  if (fuzzyTitleMatching.length) return fuzzyTitleMatching[0];

  const excerptMatching = parents
    .filter((game) => excerptText.includes(normalize(game.title)))
    .sort((a, b) => normalize(b.title).length - normalize(a.title).length);
  if (excerptMatching.length) return excerptMatching[0];
  if (parents.length === 1) return parents[0];
  return null;
}

const identityDefinitions = [
  { category: "Gay", field: "sexuality", value: "gay", unit: "sexual_orientation" },
  {
    category: "Lesbian",
    field: "sexuality",
    value: "lesbian",
    unit: "sexual_orientation",
  },
  {
    category: "Bisexual",
    field: "sexuality",
    value: "bisexual",
    unit: "sexual_orientation",
  },
  {
    category: "Pansexual",
    field: "sexuality",
    value: "pansexual",
    unit: "sexual_orientation",
  },
  {
    category: "Asexual",
    field: "sexuality",
    value: "asexual",
    unit: "sexual_orientation",
  },
  {
    category: "Demisexual",
    field: "sexuality",
    value: "other",
    unit: "sexual_orientation",
  },
  {
    category: "Aromantic",
    field: "sexuality",
    value: "aromantic",
    unit: "romantic_orientation",
  },
  {
    category: "Transgender",
    field: "gender",
    value: "transgender",
    unit: "gender_identity",
  },
  {
    category: "Non-binary or Genderqueer",
    field: "gender",
    value: "non_binary",
    unit: "gender_identity",
  },
  {
    category: "Intersex",
    field: "identity",
    value: "intersex_variation",
    unit: "intersex_variation",
  },
];

function categoryLevel(categories, category) {
  const exact = new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\((explicit|implicit)\\)$`, "i");
  for (const value of categories) {
    const match = value.match(exact);
    if (match) return match[1].toLowerCase();
  }
  return "";
}

function classifyIdentities(categories) {
  const allIdentities = identityDefinitions
    .map((definition) => ({
      ...definition,
      level: categoryLevel(categories, definition.category),
    }))
    .filter((identity) => identity.level);
  const explicit = allIdentities.some((identity) => identity.level === "explicit");
  const identities = explicit
    ? allIdentities.filter((identity) => identity.level === "explicit")
    : allIdentities;
  const categorySet = new Set(categories.map((category) => category.toLowerCase()));
  const hasTransIdentity = identities.some(
    (identity) => identity.category === "Transgender",
  );
  const hasNonBinaryIdentity = identities.some(
    (identity) => identity.category === "Non-binary or Genderqueer",
  );

  let gender = "not_recorded";
  if (hasTransIdentity && categorySet.has("queer women")) gender = "trans_woman";
  else if (hasTransIdentity && categorySet.has("queer men")) gender = "trans_man";
  else if (hasNonBinaryIdentity) gender = "non_binary";
  else if (hasTransIdentity) gender = "other";
  else if (categorySet.has("queer women")) gender = "woman";
  else if (categorySet.has("queer men")) gender = "man";

  const sexuality = [
    ...new Set(
      identities
        .filter((identity) => identity.field === "sexuality")
        .map((identity) => identity.value),
    ),
  ];
  const identityCategories = [
    ...new Set(identities.map((identity) => identity.unit)),
  ];
  return {
    explicit,
    gender,
    sexuality: sexuality.length ? sexuality.join("; ") : "not_recorded",
    identityCategory: [...new Set(identityCategories)].join("; "),
    levels: allIdentities.map(
      (identity) => `${identity.category.toLowerCase()}:${identity.level}`,
    ),
    items: identities,
  };
}

const cwd = process.cwd();
const auditPath = path.join(cwd, "src", "data", "lgbtq_archive_link_audit.csv");
const catalogPath = path.join(cwd, "src", "data", "lgbtq_game_catalog.csv");
const charactersPath = path.join(cwd, "src", "data", "pressq_seed_dataset.csv");
const readingsPath = path.join(cwd, "src", "data", "queer_readings.csv");
const systemsPath = path.join(cwd, "src", "data", "game_queer_systems.csv");
const previewPath = path.join(
  cwd,
  "src",
  "data",
  "lgbtq_archive_character_import_preview.csv",
);
const skippedPath = path.join(
  cwd,
  "src",
  "data",
  "lgbtq_archive_character_import_skipped.csv",
);

const [auditCsv, catalogCsv, charactersCsv, readingsCsv, systemsCsv] = await Promise.all([
  readFile(auditPath, "utf8"),
  readFile(catalogPath, "utf8"),
  readFile(charactersPath, "utf8"),
  readFile(readingsPath, "utf8"),
  readFile(systemsPath, "utf8"),
]);
const audit = Papa.parse(auditCsv, { header: true, skipEmptyLines: true }).data;
const catalog = Papa.parse(catalogCsv, { header: true, skipEmptyLines: true }).data;
const characters = Papa.parse(charactersCsv, {
  header: true,
  skipEmptyLines: true,
}).data;
const headers = Papa.parse(charactersCsv, { header: true }).meta.fields;
const readings = Papa.parse(readingsCsv, { header: true, skipEmptyLines: true }).data;
const systems = Papa.parse(systemsCsv, { header: true, skipEmptyLines: true }).data;
const existingKeys = new Set(
  characters.map((row) => `${normalize(row.character_name)}|${normalize(row.game_title)}`),
);
const existingEvidence = new Set(
  characters
    .flatMap((row) => String(row.evidence_source ?? "").match(/https?:\/\/[^\s]+/g) ?? [])
    .map(canonicalUrl),
);
const otherUnitEvidence = new Set(
  [...readings, ...systems]
    .flatMap((row) => String(row.evidence_source ?? "").match(/https?:\/\/[^\s]+/g) ?? [])
    .map(canonicalUrl),
);
const reviewed = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Toronto",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
let nextId = Math.max(...characters.map((row) => Number(row.character_id) || 0)) + 1;
const additions = [];
const skipped = [];
const readingOnlyUrls = new Set([
  "https://lgbtqgamearchive.com/2015/11/20/leo-in-tekken-series",
  "https://lgbtqgamearchive.com/2018/01/12/simon-jarrett-in-soma",
]);

for (const source of audit) {
  if (source.review_status !== "needs_character_review") continue;
  if (readingOnlyUrls.has(canonicalUrl(source.reference_url))) {
    skipped.push({ reason: "requires_queer_reading_unit", source });
    continue;
  }
  if (existingEvidence.has(canonicalUrl(source.reference_url))) {
    skipped.push({ reason: "evidence_already_registered", source });
    continue;
  }
  if (otherUnitEvidence.has(canonicalUrl(source.reference_url))) {
    skipped.push({ reason: "evidence_registered_in_other_unit", source });
    continue;
  }
  const categories = list(source.category_names);
  const identities = classifyIdentities(categories);
  if (!identities.levels.length) {
    skipped.push({ reason: "no_explicit_or_implicit_identity_category", source });
    continue;
  }
  const excerpt = normalize(source.source_excerpt);
  const archiveLevels = [...identities.levels];
  let curatorialQualification = "";
  const orientationDisavowed =
    /doesn t explicitly have queer content that identifies (?:his|her|their) sexual orientation/.test(
      excerpt,
    ) ||
    /(?:sexuality|sexual orientation|orientation) (?:is|was) (?:not|never) (?:explicitly )?(?:stated|identified|confirmed|disclosed)/.test(
      excerpt,
    ) ||
    /orientation (?:is|was) not disclosed/.test(excerpt) ||
    /if not explicitly stated/.test(excerpt) ||
    /rumou?red to be (?:gay|lesbian|bisexual|pansexual|asexual)/.test(excerpt);
  if (orientationDisavowed) {
    if (categories.includes("Optional Relationship")) {
      identities.sexuality = "player_defined";
      curatorialQualification =
        "Press Q treats the orientation as player-defined because the source says no fixed sexual orientation is identified.";
    } else {
      curatorialQualification =
        "Press Q records the orientation as ambiguous because the source describes it as rumored, implied, or not explicitly stated.";
    }
    identities.explicit = identities.items.some(
      (identity) =>
        identity.level === "explicit" && identity.field !== "sexuality",
    );
    identities.levels = identities.levels.filter(
      (level) => !/^(?:gay|lesbian|bisexual|pansexual|asexual|demisexual|aromantic):/.test(level),
    );
    identities.levels.push("sexual_orientation:unconfirmed");
  }
  const names = splitSubjects(source);
  if (!names.length) {
    skipped.push({ reason: "group_or_non_character_subject", source });
    continue;
  }
  if (
    names.length > 1 &&
    categories.includes("Optional Relationship") &&
    identities.items.some((identity) => identity.field === "sexuality")
  ) {
    identities.explicit = identities.items.some(
      (identity) =>
        identity.level === "explicit" && identity.field !== "sexuality",
    );
    curatorialQualification = `${curatorialQualification ? `${curatorialQualification} ` : ""}Press Q does not assign one fixed orientation to every person in an optional pair from a shared relationship page.`;
  }
  const game = deriveGame(source, catalog);
  if (!game?.title || !game.year) {
    skipped.push({ reason: "unresolved_game_version", source });
    continue;
  }

  for (const name of names) {
    const key = `${normalize(name)}|${normalize(game.title)}`;
    if (existingKeys.has(key)) {
      skipped.push({ reason: "character_game_already_registered", source });
      continue;
    }
    const row = Object.fromEntries(headers.map((header) => [header, ""]));
    Object.assign(row, {
      character_id: String(nextId),
      character_name: name,
      game_title: game.title,
      release_year: game.year,
      narrative_role: "unknown",
      playable_status: categories.includes("Playable Character") ? "playable" : "unknown",
      gender: identities.gender,
      sexuality: identities.sexuality,
      identity_category: identities.identityCategory,
      identity_confirmation: identities.explicit
        ? "explicit_in_game"
        : "not_explicit_in_game",
      queer_status: identities.explicit ? "confirmed" : "ambiguous",
      evidence_source: canonicalUrl(source.reference_url),
      notes: `LGBTQ Video Game Archive classification: ${archiveLevels.join(", ")}. Source page: ${cleanText(source.reference_page_title)}.${curatorialQualification ? ` ${curatorialQualification}` : ""}`,
      source_language: "en",
      discovery_source: "LGBTQ Video Game Archive",
      research_status: "reviewed",
      evidence_confidence: identities.explicit ? "high" : "medium",
      last_reviewed: reviewed,
    });
    additions.push(row);
    existingKeys.add(key);
    nextId += 1;
  }
}

await writeFile(previewPath, Papa.unparse(additions, { columns: headers, newline: "\n" }) + "\n", "utf8");
await writeFile(
  skippedPath,
  Papa.unparse(
    skipped.map(({ reason, source }) => ({
      reason,
      reference_label: source.reference_label,
      parent_game_titles: source.parent_game_titles,
      parent_release_years: source.parent_release_years,
      reference_page_title: source.reference_page_title,
      category_names: source.category_names,
      reference_url: source.reference_url,
    })),
    { newline: "\n" },
  ) + "\n",
  "utf8",
);
if (shouldWrite && additions.length) {
  await writeFile(
    charactersPath,
    Papa.unparse([...characters, ...additions], { columns: headers, newline: "\n" }) + "\n",
    "utf8",
  );
}

const skippedReasons = skipped.reduce((counts, item) => {
  counts[item.reason] = (counts[item.reason] ?? 0) + 1;
  return counts;
}, {});
console.log(
  JSON.stringify(
    {
      mode: shouldWrite ? "write" : "preview",
      existingCharacters: characters.length,
      proposedCharacterRows: additions.length,
      confirmed: additions.filter((row) => row.queer_status === "confirmed").length,
      ambiguous: additions.filter((row) => row.queer_status === "ambiguous").length,
      skippedReasons,
      previewPath,
      skippedPath,
      charactersPath: shouldWrite ? charactersPath : "unchanged",
    },
    null,
    2,
  ),
);
