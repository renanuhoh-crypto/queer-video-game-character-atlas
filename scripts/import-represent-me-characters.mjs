import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import Papa from "papaparse";

const BASE_URL = "https://representme.charity";
const SPREADSHEET_URL = `${BASE_URL}/projects/queer/database/spreadsheet/`;
const shouldWrite = process.argv.includes("--write");
const concurrency = 12;

const namedEntities = "[A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ0-9'’.-]*(?:\\s+(?:[A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ0-9'’.-]*|of|the|de|da|dos|van|von)){0,5}";
const identityExpression = [
  "transgender woman",
  "transgender man",
  "trans woman",
  "trans man",
  "non[- ]?binary",
  "gender[- ]?nonconforming",
  "gender non[- ]?conforming",
  "genderqueer",
  "genderfluid",
  "agender",
  "bisexual",
  "plurisexual",
  "pansexual",
  "lesbian",
  "aroace",
  "aromantic",
  "asexual",
  "gay",
  "queer",
].join("|");

const blockedNames = new Set(
  [
    "A",
    "An",
    "Another",
    "Character",
    "Content",
    "Game",
    "Girl",
    "He",
    "Her",
    "His",
    "It",
    "Love",
    "Man",
    "NPC",
    "One",
    "Other",
    "Player",
    "Protagonist",
    "Representation",
    "She",
    "Some",
    "The",
    "There",
    "Their",
    "They",
    "This",
    "Trans",
    "Woman",
  ].map((value) => value.toLowerCase()),
);

const knownConflicts = new Map([
  [
    "ai the somnium files|peter",
    {
      reason: "possible_name_mismatch",
      note: "Represent Me writes Peter; the LGBTQ Video Game Archive record names Futa ‘Pewter’ Amanoma. This candidate was not imported automatically.",
    },
  ],
  [
    "marvel avengers academy|brian falsworth",
    {
      reason: "possible_alias_duplicate",
      note: "Brian Falsworth is the Union Jack already registered for this game. This candidate was not imported as a second character.",
    },
  ],
]);

const candidateOverrides = new Map([
  ["13 sentinels aegis rim|tsukasa okino", { ambiguous: false }],
  ["deadly premonition|thomas", { ambiguous: true }],
  ["doctor who infinity|bill", { ambiguous: false }],
  [
    "dishonored 2|mindy blanchard",
    { confirmation: "external_source; developer_confirmed" },
  ],
  ["hack link|endrance", { ambiguous: true }],
  ["i miss the sunrise|kara", { ambiguous: true }],
  ["firstborn|guardian", { name: "The Guardian" }],
  ["mafia iii|nicki", { name: "Nicki Burke" }],
  ["mafia iii|tony derazio", { ambiguous: true }],
  [
    "mission it s complicated|roxanne",
    {
      gender: [],
      sexuality: ["lesbian"],
      categories: ["sexual_orientation"],
      identities: ["lesbian"],
      ambiguous: false,
    },
  ],
  [
    "scrambled syd city|enchantress",
    {
      gender: [],
      sexuality: ["lesbian"],
      categories: ["sexual_orientation"],
      identities: ["lesbian"],
      ambiguous: false,
    },
  ],
  ["sonic the hedgehog 2|tails", { ambiguous: true }],
  ["overwatch|tracer", { confirmation: "external_source; developer_confirmed" }],
  [
    "that boy is a monstr|sam",
    {
      gender: ["trans_man"],
      sexuality: ["pansexual"],
      categories: ["gender_identity", "sexual_orientation"],
      identities: ["trans man", "pansexual"],
      ambiguous: false,
    },
  ],
  ["the lion s song|emma", { ambiguous: true }],
  ["the arcana|asra", { confirmation: "external_source; developer_confirmed" }],
  [
    "the walking dead|javier",
    {
      gameTitle: "The Walking Dead: A New Frontier",
      releaseYear: "2016",
      confirmation: "external_source; developer_confirmed",
    },
  ],
  [
    "the walking dead|violet",
    {
      gameTitle: "The Walking Dead: The Final Season",
      releaseYear: "2018",
    },
  ],
  ["vandal hearts ii|gilti", { ambiguous: true }],
  [
    "fran and the demon hunter|alex",
    { gameTitle: "Fran and the Demon Hunter", releaseYear: "2019" },
  ],
  [
    "fran and the demon hunter|nomade",
    { gameTitle: "Nomade the Demon Hunter", releaseYear: "2020" },
  ],
]);

const curatedCandidates = new Map([
  [
    "a new beginning",
    [
      {
        name: "Duve",
        identities: ["gay"],
        gender: ["man"],
        sexuality: ["gay"],
        categories: ["sexual_orientation"],
        ambiguous: false,
        narrativeRole: "supporting_character",
      },
    ],
  ],
  [
    "ai the somnium files",
    [
      {
        name: "Mama",
        identities: ["trans woman"],
        gender: ["trans_woman"],
        sexuality: [],
        categories: ["gender_identity"],
        ambiguous: false,
        narrativeRole: "supporting_character",
      },
    ],
  ],
  [
    "butterfly soup",
    [
      {
        name: "Min-Seo",
        identities: ["nonbinary"],
        gender: ["non_binary"],
        sexuality: [],
        categories: ["gender_identity"],
        ambiguous: false,
        narrativeRole: "supporting_character",
        confirmation: "external_source; developer_confirmed",
      },
    ],
  ],
  [
    "doctor who infinity",
    [
      {
        name: "Missy",
        identities: ["trans coding"],
        gender: [],
        sexuality: [],
        categories: ["gender_expression"],
        ambiguous: true,
        narrativeRole: "protagonist",
      },
    ],
  ],
  [
    "dorakone",
    ["Brin", "Honoree", "Rayen"].map((name) => ({
      name,
      identities: ["lesbian"],
      gender: [],
      sexuality: ["lesbian"],
      categories: ["sexual_orientation"],
      ambiguous: false,
      narrativeRole: "supporting_character",
    })),
  ],
  [
    "mission it s complicated",
    [
      {
        name: "Cody (Riptide)",
        identities: ["gay", "trans man"],
        gender: ["trans_man"],
        sexuality: ["gay"],
        categories: ["gender_identity", "sexual_orientation"],
        ambiguous: false,
      },
      {
        name: "Nicole (Wifi)",
        identities: ["bisexual"],
        gender: ["woman"],
        sexuality: ["bisexual"],
        categories: ["sexual_orientation"],
        ambiguous: false,
      },
      {
        name: "Zael",
        identities: ["pansexual", "nonbinary"],
        gender: ["non_binary"],
        sexuality: ["pansexual"],
        categories: ["gender_identity", "sexual_orientation"],
        ambiguous: false,
      },
      {
        name: "Sam (Nightgaunt)",
        identities: ["bisexual"],
        gender: ["man"],
        sexuality: ["bisexual"],
        categories: ["sexual_orientation"],
        ambiguous: false,
      },
    ],
  ],
  [
    "nanh heroes go ex",
    [
      {
        name: "Siofra",
        identities: ["lesbian"],
        gender: [],
        sexuality: ["lesbian"],
        categories: ["sexual_orientation"],
        ambiguous: false,
        narrativeRole: "protagonist",
      },
    ],
  ],
]);

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
    mdash: "—",
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
  return decodeHtml(String(value ?? "").replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
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
    const url = new URL(String(value), BASE_URL);
    url.protocol = "https:";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function appendList(current, value) {
  return unique(
    `${current || ""}; ${value || ""}`
      .split(";")
      .map((item) => item.trim()),
  ).join("; ");
}

function pageParagraphs(html) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
  return [...main.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => cleanText(match[1]))
    .filter((paragraph) => paragraph.length >= 12);
}

function fact(html, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return cleanText(
    html.match(
      new RegExp(
        `<dt\\b[^>]*>\\s*${escaped}:?\\s*<\\/dt>\\s*<dd\\b[^>]*>([\\s\\S]*?)<\\/dd>`,
        "i",
      ),
    )?.[1] ?? "",
  );
}

function pageData(html, url) {
  const title = cleanText(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
  const repTags = unique(
    [...html.matchAll(/data-pagefind-filter="rep_[^"]*"[^>]*>([\s\S]*?)<\/span>/gi)]
      .map((match) => cleanText(match[1])),
  );
  return {
    title,
    year: fact(html, "Year"),
    developer: fact(html, "Developer"),
    publisher: fact(html, "Publisher"),
    genre: fact(html, "Genre"),
    platform: fact(html, "Platform/s") || fact(html, "Platform"),
    paragraphs: pageParagraphs(html),
    repTags,
    url: canonicalUrl(url),
  };
}

function identityFields(rawIdentity) {
  const identity = normalize(rawIdentity);
  if (identity === "transgender woman" || identity === "trans woman") {
    return {
      label: "trans woman",
      gender: ["trans_woman"],
      sexuality: [],
      categories: ["gender_identity"],
    };
  }
  if (identity === "transgender man" || identity === "trans man") {
    return {
      label: "trans man",
      gender: ["trans_man"],
      sexuality: [],
      categories: ["gender_identity"],
    };
  }
  if (/^non ?binary$/.test(identity)) {
    return {
      label: "nonbinary",
      gender: ["non_binary"],
      sexuality: [],
      categories: ["gender_identity"],
    };
  }
  if (/gender nonconforming/.test(identity)) {
    return {
      label: "gender-nonconforming",
      gender: [],
      sexuality: [],
      categories: ["gender_expression"],
    };
  }
  if (["genderqueer", "genderfluid", "agender"].includes(identity)) {
    return {
      label: identity,
      gender: [identity],
      sexuality: [],
      categories: ["gender_identity"],
    };
  }
  if (identity === "aroace") {
    return {
      label: "aroace",
      gender: [],
      sexuality: ["asexual", "aromantic"],
      categories: ["sexual_orientation", "romantic_orientation"],
    };
  }
  if (identity === "aromantic") {
    return {
      label: "aromantic",
      gender: [],
      sexuality: ["aromantic"],
      categories: ["romantic_orientation"],
    };
  }
  const sexuality = identity === "plurisexual" ? "bisexual" : identity;
  return {
    label: identity,
    gender: [],
    sexuality: [sexuality],
    categories: ["sexual_orientation"],
  };
}

function cleanName(value) {
  return cleanText(value)
    .replace(/^(?:the|a|an)\s+/i, "")
    .replace(/[,:;.!?]+$/, "")
    .replace(/['’]s$/i, "")
    .trim();
}

function validName(value) {
  const name = cleanName(value);
  if (!name || name.length < 2 || name.length > 72) return false;
  if (blockedNames.has(name.toLowerCase())) return false;
  if (/^(?:the|this|that|some|another|one|other)\b/i.test(name)) return false;
  if (/\b(?:character|protagonist|player|relationship|representation|identity|game|story|content)\b/i.test(name)) {
    return false;
  }
  const words = name.split(/\s+/);
  if (words.length > 6) return false;
  return words.every(
    (word) =>
      /^(?:of|the|de|da|dos|van|von)$/i.test(word) ||
      /^[A-ZÀ-ÖØ-Þ]/.test(word),
  );
}

function extractCandidates(page) {
  const candidates = new Map();
  const patterns = [
    {
      rule: "named_subject_identity",
      regex: new RegExp(
        `\\b(${namedEntities})\\s*,?\\s+(?:is|was|identifies as|identified as|comes out as|came out as|is described as|was described as)\\s+(?:also\\s+)?(?:a|an)?\\s*(${identityExpression})\\b`,
        "g",
      ),
      nameGroup: 1,
      identityGroup: 2,
    },
    {
      rule: "appositive_subject_identity",
      regex: new RegExp(
        `\\b(?:character|protagonist|npc|companion|villain|antagonist)\\s*,?\\s*(?:named|called)?\\s*(${namedEntities})\\s*,?\\s+(?:is|was|identifies as|identified as|comes out as|came out as)\\s+(?:a|an)?\\s*(${identityExpression})\\b`,
        "g",
      ),
      nameGroup: 1,
      identityGroup: 2,
    },
    {
      rule: "identity_then_named_character",
      regex: new RegExp(
        `\\b(?:[Aa]|[Aa]n|[Tt]he)\\s+(${identityExpression})\\s+(?:character|woman|man|person|protagonist|npc)(?:\\s+(?:named|called)\\s+|\\s*,\\s*)(${namedEntities})\\b`,
        "g",
      ),
      nameGroup: 2,
      identityGroup: 1,
    },
    {
      rule: "named_character_apposition",
      regex: new RegExp(
        `\\b(${namedEntities})\\s*,\\s+(?:a|an|the)\\s+(${identityExpression})\\s+(?:character|woman|man|person|protagonist|npc)\\b`,
        "g",
      ),
      nameGroup: 1,
      identityGroup: 2,
    },
    {
      rule: "features_identity_named_character",
      regex: new RegExp(
        `\\b(?:[Ff]eatures|[Ii]ncludes|[Ii]ntroduces)\\s+(?:a|an|the)?\\s*(${identityExpression})\\s+(?:character|woman|man|person|protagonist|npc)\\s*,?\\s*(?:named|called)?\\s*(${namedEntities})\\b`,
        "g",
      ),
      nameGroup: 2,
      identityGroup: 1,
    },
    {
      rule: "role_owned_by_identity_name",
      regex: new RegExp(
        `\\b(?:[Oo]wned|[Rr]un|[Mm]anaged|[Ll]ed) by\\s+(?:a|an|the)\\s+(${identityExpression})\\s+(?:character|woman|man|person)\\s*,?\\s*(?:named|called)?\\s*(${namedEntities})\\b`,
        "g",
      ),
      nameGroup: 2,
      identityGroup: 1,
    },
  ];

  for (const paragraph of page.paragraphs) {
    const sentences = paragraph
      .split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ“"'])/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);
    for (const sentence of sentences) {
      if (!new RegExp(`\\b(?:${identityExpression})\\b`, "i").test(sentence)) continue;
      const sentenceCandidateKeys = new Set();
      for (const pattern of patterns) {
        pattern.regex.lastIndex = 0;
        for (const match of sentence.matchAll(pattern.regex)) {
          const name = cleanName(match[pattern.nameGroup]);
          if (!validName(name)) continue;
          if (
            normalize(page.title).includes(normalize(name))
          ) {
            continue;
          }
          const identity = identityFields(match[pattern.identityGroup]);
          const key = normalize(name);
          const existing = candidates.get(key) ?? {
            name,
            identities: [],
            gender: [],
            sexuality: [],
            categories: [],
            rules: [],
            explicitAssociation: false,
            narrativeRoles: [],
          };
          existing.identities.push(identity.label);
          existing.gender.push(...identity.gender);
          existing.sexuality.push(...identity.sexuality);
          existing.categories.push(...identity.categories);
          existing.rules.push(pattern.rule);
          const paragraphNameIndex = paragraph
            .toLowerCase()
            .indexOf(name.toLowerCase());
          const associationContext = paragraph.slice(
            Math.max(0, paragraphNameIndex - 70),
            Math.min(paragraph.length, paragraphNameIndex + name.length + 130),
          );
          const associationIsQualified =
            /\b(?:ambiguous|ambiguity|coded as|implied|implies|indication|interpretation|interpreted|may|might|not explicitly|not confirmed|rumou?red|believe|whether)\b/i.test(
              associationContext,
            );
          existing.explicitAssociation ||= !associationIsQualified;
          const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const escapedIdentity = match[pattern.identityGroup].replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&",
          );
          const genderMatch = sentence.match(
            new RegExp(
              `\\b${escapedName}\\s*,?\\s+(?:is\\s+)?(?:a|an)?\\s*${escapedIdentity}\\s+(woman|man)\\b`,
              "i",
            ),
          );
          if (genderMatch && !identity.gender.length) {
            existing.gender.push(genderMatch[1].toLowerCase());
          }
          const tail = sentence.slice(match.index + match[0].length, match.index + match[0].length + 48);
          for (const tailMatch of tail.matchAll(
            new RegExp(
              `^(?:\\s*(?:,|and)\\s*|\\s+)(${identityExpression})\\b`,
              "gi",
            ),
          )) {
            const linkedIdentity = identityFields(tailMatch[1]);
            existing.identities.push(linkedIdentity.label);
            existing.gender.push(...linkedIdentity.gender);
            existing.sexuality.push(...linkedIdentity.sexuality);
            existing.categories.push(...linkedIdentity.categories);
          }
          if (
            new RegExp(
              `\\bprotagonist\\b[^.!?]{0,80}\\b${escapedName}\\b|\\b${escapedName}\\b[^.!?]{0,40}\\bprotagonist\\b`,
              "i",
            ).test(sentence)
          ) {
            existing.narrativeRoles.push("protagonist");
          }
          candidates.set(key, existing);
          sentenceCandidateKeys.add(key);
        }
      }

    }
  }

  return [...candidates.values()].map((candidate) => ({
    ...candidate,
    identities: unique(candidate.identities),
    gender: unique(candidate.gender),
    sexuality: unique(candidate.sexuality),
    categories: unique(candidate.categories),
    rules: unique(candidate.rules),
    ambiguous: !candidate.explicitAssociation,
    narrativeRole: unique(candidate.narrativeRoles).includes("protagonist")
      ? "protagonist"
      : "unknown",
  }));
}

async function fetchText(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "user-agent": "PressQResearchBot/1.0 (+https://representme.charity/)",
        },
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  }
  throw lastError;
}

async function mapConcurrent(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

const cwd = process.cwd();
const charactersPath = path.join(cwd, "src", "data", "pressq_seed_dataset.csv");
const previewPath = path.join(cwd, "src", "data", "represent_me_character_import_preview.csv");
const reviewQueuePath = path.join(cwd, "src", "data", "represent_me_game_review_queue.csv");
const overlapPath = path.join(cwd, "src", "data", "represent_me_overlap_report.csv");

const charactersCsv = await readFile(charactersPath, "utf8");
const parsedCharacters = Papa.parse(charactersCsv, { header: true, skipEmptyLines: true });
const characters = parsedCharacters.data;
const headers = parsedCharacters.meta.fields;
const existingByKey = new Map(
  characters.map((row) => [
    `${normalize(row.character_name)}|${normalize(row.game_title)}`,
    row,
  ]),
);

const spreadsheetHtml = await fetchText(SPREADSHEET_URL);
const pageUrls = unique(
  [...spreadsheetHtml.matchAll(/href="(\/projects\/queer\/database\/title\/[^"]+)"/gi)]
    .map((match) => canonicalUrl(match[1])),
).sort();

let completed = 0;
const failures = [];
const pages = (
  await mapConcurrent(pageUrls, concurrency, async (url) => {
    try {
      const html = await fetchText(url);
      return pageData(html, url);
    } catch (error) {
      failures.push({ url, error: String(error?.message ?? error) });
      return null;
    } finally {
      completed += 1;
      if (completed % 100 === 0 || completed === pageUrls.length) {
        console.log(`Fetched ${completed}/${pageUrls.length} Represent Me entries`);
      }
    }
  })
).filter(Boolean);

const reviewed = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Toronto",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
let nextId = Math.max(...characters.map((row) => Number(row.character_id) || 0)) + 1;
const additions = [];
const overlaps = [];
const reviewQueue = [];
let mergedExisting = 0;

for (const page of pages) {
  const extracted = extractCandidates(page);
  for (const curated of curatedCandidates.get(normalize(page.title)) ?? []) {
    const index = extracted.findIndex(
      (candidate) => normalize(candidate.name) === normalize(curated.name),
    );
    if (index >= 0) extracted[index] = { ...extracted[index], ...curated };
    else extracted.push({ ...curated, rules: ["curated_page_review"] });
  }
  if (/\b(?:series|franchise)\b|\(developer\)/i.test(page.title)) {
    reviewQueue.push({
      game_title: page.title,
      release_year: page.year,
      represent_me_url: page.url,
      representation_tags: page.repTags.join("; "),
      review_reason: "aggregate_page_requires_game_version",
    });
    continue;
  }
  if (!extracted.length) {
    reviewQueue.push({
      game_title: page.title,
      release_year: page.year,
      represent_me_url: page.url,
      representation_tags: page.repTags.join("; "),
      review_reason: "no_explicit_named_character_pattern",
    });
    continue;
  }

  for (const candidate of extracted) {
    const conflict = knownConflicts.get(`${normalize(page.title)}|${normalize(candidate.name)}`);
    if (conflict) {
      overlaps.push({
        report_type: conflict.reason,
        existing_character_id: "",
        character_name: candidate.name,
        game_title: page.title,
        existing_identity: "",
        represent_me_identity: candidate.identities.join("; "),
        represent_me_url: page.url,
        note: conflict.note,
      });
      continue;
    }

    const override =
      candidateOverrides.get(`${normalize(page.title)}|${normalize(candidate.name)}`) ?? {};
    const effective = { ...candidate, ...override };
    const characterName = effective.name ?? candidate.name;
    const gameTitle = effective.gameTitle ?? page.title;
    const rawReleaseYear = effective.releaseYear ?? page.year;
    const releaseYear = /^\d{4}$/.test(rawReleaseYear) ? rawReleaseYear : "";
    const key = `${normalize(characterName)}|${normalize(gameTitle)}`;
    const existing = existingByKey.get(key);
    if (existing) {
      const existingIdentity = appendList(existing.gender, existing.sexuality);
      const extractedIdentity = appendList(
        effective.gender.join("; "),
        effective.sexuality.join("; "),
      );
      const overlap = unique(
        existingIdentity
          .split(";")
          .map((item) => normalize(item))
          .filter(Boolean),
      ).some((item) =>
        extractedIdentity
          .split(";")
          .map((value) => normalize(value))
          .includes(item),
      );
      overlaps.push({
        report_type: overlap ? "duplicate_compatible" : "identity_divergence_review",
        existing_character_id: existing.character_id,
        character_name: characterName,
        game_title: gameTitle,
        existing_identity: existingIdentity,
        represent_me_identity: extractedIdentity,
        represent_me_url: page.url,
        note: overlap
          ? "The character/game pair already exists; write mode adds Represent Me to its evidence and discovery sources."
          : "The identities do not align exactly; review both sources before changing the record.",
      });
      if (overlap && shouldWrite) {
        existing.evidence_source = appendList(existing.evidence_source, page.url);
        existing.discovery_source = appendList(
          existing.discovery_source,
          "Represent Me",
        );
        mergedExisting += 1;
      }
      continue;
    }

    const row = Object.fromEntries(headers.map((header) => [header, ""]));
    Object.assign(row, {
      character_id: String(nextId),
      character_name: characterName,
      game_title: gameTitle,
      release_year: releaseYear,
      developer: page.developer,
      publisher: page.publisher,
      genre: page.genre,
      narrative_role: effective.narrativeRole ?? "unknown",
      playable_status: "unknown",
      gender: effective.gender.length ? effective.gender.join("; ") : "not_recorded",
      sexuality: effective.sexuality.length
        ? effective.sexuality.join("; ")
        : "not_recorded",
      identity_category: effective.categories.join("; "),
      identity_confirmation: effective.confirmation ?? (effective.ambiguous ? "ambiguous" : "external_source"),
      queer_status: effective.ambiguous ? "ambiguous" : "confirmed",
      intersectionality_present: "",
      intersectionality_details: "",
      evidence_source: page.url,
      notes: effective.ambiguous
        ? `Represent Me discusses ${characterName} in connection with ${effective.identities.join(
            "; ",
          )}, but its wording is interpretive or uncertain. Imported as ambiguous and queued for curator review.`
        : `Represent Me explicitly associates ${characterName} with ${effective.identities.join(
            "; ",
          )} in its entry for ${page.title}. Imported by a high-precision text pattern and queued for curator review.`,
      source_language: "en",
      discovery_source: "Represent Me",
      research_status: "needs_verification",
      evidence_confidence: effective.ambiguous ? "low" : "medium",
      platform_version: page.platform,
      last_reviewed: reviewed,
      content_availability: "not_recorded",
    });
    additions.push(row);
    existingByKey.set(key, row);
    nextId += 1;
  }
}

for (const failure of failures) {
  reviewQueue.push({
    game_title: "",
    release_year: "",
    represent_me_url: failure.url,
    representation_tags: "",
    review_reason: `fetch_failed: ${failure.error}`,
  });
}

await writeFile(
  previewPath,
  Papa.unparse(additions, { columns: headers, newline: "\n" }) + "\n",
  "utf8",
);
await writeFile(
  reviewQueuePath,
  Papa.unparse(reviewQueue, { newline: "\n" }) + "\n",
  "utf8",
);
await writeFile(
  overlapPath,
  Papa.unparse(overlaps, { newline: "\n" }) + "\n",
  "utf8",
);

if (shouldWrite && additions.length) {
  await writeFile(
    charactersPath,
    Papa.unparse([...characters, ...additions], { columns: headers, newline: "\n" }) + "\n",
    "utf8",
  );
}

console.log(
  JSON.stringify(
    {
      mode: shouldWrite ? "write" : "preview",
      representMePages: pageUrls.length,
      fetchedPages: pages.length,
      fetchFailures: failures.length,
      existingCharacters: characters.length,
      proposedCharacterRows: additions.length,
      overlapReports: overlaps.length,
      mergedExisting,
      queuedGames: reviewQueue.length,
      previewPath,
      reviewQueuePath,
      overlapPath,
      charactersPath: shouldWrite ? charactersPath : "unchanged",
    },
    null,
    2,
  ),
);
