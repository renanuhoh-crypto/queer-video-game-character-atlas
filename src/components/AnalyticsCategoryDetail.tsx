"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ResearchReferences from "@/components/ResearchReferences";
import { getAnalyticsBucketDefinition } from "@/lib/analyticsBucketDefinitions";
import { getIntersectionalityMarkers } from "@/lib/analyticsIntersectionality";
import {
  ANALYTICS_CATEGORIES,
  getAnalyticsCategory,
  type AnalyticsCategorySlug,
} from "@/lib/analyticsCategories";

type CharacterRecord = {
  character_id: string;
  character_name: string;
  game_title: string;
  release_year?: number | null;
  developer?: string;
  playable?: boolean;
  playable_status?: string;
  gender?: string;
  sexuality?: string;
  identity_category?: string[];
  intersectionality?: string[];
  intersectionality_present?: string;
  intersectionality_details?: string;
  game_scale?: string;
  notes?: string;
  evidence_source?: string;
  research_status?: string;
  evidence_confidence?: string;
  queer_status?: string;
};

type SystemRecord = {
  system_id: string;
  game_title: string;
  release_year?: number | null;
  system_type?: string;
  system_description?: string;
  scope?: string;
  player_dependency?: string;
  availability?: string;
  limitations?: string;
  research_status?: string;
  evidence_confidence?: string;
};

type ReadingRecord = {
  reading_id: string;
  game_title: string;
  release_year?: number | null;
  subject?: string;
  subject_type?: string;
  reading_type?: string;
  reading_status?: string;
  reading_summary?: string;
  counterevidence?: string;
  notes?: string;
  research_status?: string;
  evidence_confidence?: string;
};

type ExampleRecord = {
  id: string;
  kind: "Character" | "System" | "Queer reading";
  title: string;
  subtitle: string;
  meta: string;
  detail: string;
};

type CategoryBucket = {
  key: string;
  label: string;
  entries: ExampleRecord[];
  percentage: number;
};

const VALUE_LABELS: Record<string, string> = {
  playable: "Playable",
  non_playable: "Non-playable",
  optional: "Optional",
  unknown: "Unknown",
  not_recorded: "Not recorded",
  none_documented: "None documented",
  documented_unspecified: "Documented, marker unspecified",
  aaa: "AAA",
  aa: "AA",
  indie: "Independent",
  student_amateur: "Student / amateur",
  gender_identity: "Gender identity",
  sexual_orientation: "Sexual orientation",
  romantic_orientation: "Romantic orientation",
  intersex_variation: "Intersex variation",
  gender_expression: "Gender expression",
  character_creation: "Character creation",
  gender_customization: "Gender customization",
  pronoun_selection: "Pronoun selection",
  sexuality_customization: "Sexuality customization",
  same_gender_romance: "Same-gender romance",
  gender_independent_romance: "Gender-independent romance",
  same_gender_marriage: "Same-gender marriage",
  queer_family_creation: "Queer family creation",
  relationship_system: "Relationship system",
  player_avatar: "Player avatar",
  npc: "NPCs",
  relationships: "Relationships",
  family: "Family",
  world: "Game world",
  none: "None",
  partial: "Partial",
  full: "Full",
  default: "Default",
  conditional: "Conditional",
  expansion: "Expansion / DLC",
  mod_only: "Mods only",
  reviewed: "Reviewed",
  in_progress: "In research",
  identified: "Identified / queued",
  needs_verification: "Needs verification",
  high: "High",
  medium: "Medium",
  low: "Low",
  person_of_color: "Person of color",
  race_ethnicity: "Race / ethnicity",
  nationality_migration: "Nationality / migration",
  other_axis: "Other documented axis",
  non_binary: "Nonbinary",
  trans_woman: "Trans woman",
  trans_man: "Trans man",
  player_defined: "Player-defined",
  conditional_or_player_defined: "Conditional or player-defined representation",
  sexuality: "Sexuality reading",
  queer_theme: "Queer theme",
  queerly_read: "Queerly read",
  contested: "Contested",
  creator_refuted: "Creator-refuted",
  en: "English (en)",
};

const CONDITIONAL_SEXUALITY_KEY = "conditional_or_player_defined";

function normalize(value?: string | null) {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "";
}

function splitValues(value?: string | null) {
  if (!value) return [];
  return value
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function labelFor(key: string) {
  if (VALUE_LABELS[key]) return VALUE_LABELS[key];
  return key.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function excerpt(value?: string, limit = 260) {
  const text = value?.replace(/\s+/g, " ").trim() || "";
  if (!text) return "No additional evidence note has been recorded for this example yet.";
  return text.length > limit ? `${text.slice(0, limit).trim()}…` : text;
}

function characterExample(character: CharacterRecord): ExampleRecord {
  return {
    id: `character-${character.character_id}`,
    kind: "Character",
    title: character.character_name || "Unnamed character",
    subtitle: character.game_title || "Game not recorded",
    meta: [character.release_year, character.developer].filter(Boolean).join(" · "),
    detail: excerpt(character.notes || character.evidence_source),
  };
}

function systemExample(system: SystemRecord): ExampleRecord {
  const systemType = normalize(system.system_type);
  return {
    id: `system-${system.system_id}`,
    kind: "System",
    title: systemType ? labelFor(systemType) : "System type not recorded",
    subtitle: system.game_title || "Game not recorded",
    meta: [system.release_year, system.availability ? labelFor(normalize(system.availability)) : ""]
      .filter(Boolean)
      .join(" · "),
    detail: excerpt(system.system_description || system.limitations),
  };
}

function readingExample(reading: ReadingRecord): ExampleRecord {
  const status = normalize(reading.reading_status);
  const detail = [
    reading.reading_summary,
    reading.counterevidence
      ? `Counterevidence: ${reading.counterevidence}`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    id: `reading-${reading.reading_id}`,
    kind: "Queer reading",
    title: reading.subject || "Subject not recorded",
    subtitle: reading.game_title || "Game not recorded",
    meta: [
      reading.release_year,
      status ? labelFor(status) : "",
      reading.evidence_confidence
        ? `${labelFor(normalize(reading.evidence_confidence))} confidence`
        : "",
    ]
      .filter(Boolean)
      .join(" · "),
    detail: excerpt(detail || reading.notes, 520),
  };
}

function addToBuckets(
  buckets: Map<string, ExampleRecord[]>,
  rawValues: string[],
  example: ExampleRecord,
) {
  const keys = new Set(
    rawValues
      .map(normalize)
      .map((key) => (key === "none" || key === "not_provided" ? "not_recorded" : key))
      .filter(Boolean),
  );
  if (keys.size === 0) keys.add("not_recorded");

  keys.forEach((key) => {
    const entries = buckets.get(key) || [];
    if (!entries.some((entry) => entry.id === example.id)) entries.push(example);
    buckets.set(key, entries);
  });
}

function buildCategoryData(
  slug: AnalyticsCategorySlug,
  characters: CharacterRecord[],
  systems: SystemRecord[],
  readings: ReadingRecord[],
) {
  const buckets = new Map<string, ExampleRecord[]>();
  const characterField = (getValues: (character: CharacterRecord) => string[]) =>
    characters.forEach((character) =>
      addToBuckets(buckets, getValues(character), characterExample(character)),
    );
  const systemField = (getValues: (system: SystemRecord) => string[]) =>
    systems.forEach((system) =>
      addToBuckets(buckets, getValues(system), systemExample(system)),
    );
  const readingField = (getValues: (reading: ReadingRecord) => string[]) =>
    readings.forEach((reading) =>
      addToBuckets(buckets, getValues(reading), readingExample(reading)),
    );
  const combinedField = (
    characterValues: (character: CharacterRecord) => string[],
    systemValues: (system: SystemRecord) => string[],
    readingValues: (reading: ReadingRecord) => string[],
  ) => {
    characterField(characterValues);
    systemField(systemValues);
    readingField(readingValues);
  };

  switch (slug) {
    case "playability":
      characterField((character) => [
        character.playable_status || (character.playable ? "playable" : "not_recorded"),
      ]);
      break;
    case "gender":
      characterField((character) => splitValues(character.gender));
      break;
    case "sexuality":
      characters.forEach((character) => {
        const values = splitValues(character.sexuality);
        const normalizedValues = values.map(normalize);
        const identityCategories = (character.identity_category || []).map(normalize);
        const queerStatus = normalize(character.queer_status);
        const hasSexualityContext =
          identityCategories.includes("sexual_orientation") ||
          normalizedValues.some(
            (value) =>
              !["", "none", "unknown", "not_provided", "not_recorded"].includes(
                value,
              ),
          );
        const isConditional =
          normalizedValues.includes("player_defined") ||
          (hasSexualityContext && queerStatus !== "confirmed");

        addToBuckets(
          buckets,
          isConditional ? [CONDITIONAL_SEXUALITY_KEY] : values,
          characterExample(character),
        );
      });
      break;
    case "identity-categories":
      characterField((character) => character.identity_category || []);
      break;
    case "intersectionality":
      characterField(getIntersectionalityMarkers);
      break;
    case "game-scale":
      characterField((character) => splitValues(character.game_scale));
      break;
    case "system-types":
      systemField((system) => splitValues(system.system_type));
      break;
    case "affected-scopes":
      systemField((system) => splitValues(system.scope));
      break;
    case "player-dependency":
      systemField((system) => splitValues(system.player_dependency));
      break;
    case "availability":
      systemField((system) => splitValues(system.availability));
      break;
    case "queer-readings":
      readingField((reading) => splitValues(reading.reading_type));
      break;
    case "research-status":
      combinedField(
        (character) => splitValues(character.research_status),
        (system) => splitValues(system.research_status),
        (reading) => splitValues(reading.research_status),
      );
      break;
    case "evidence-confidence":
      combinedField(
        (character) => splitValues(character.evidence_confidence),
        (system) => splitValues(system.evidence_confidence),
        (reading) => splitValues(reading.evidence_confidence),
      );
      break;
  }

  const denominator =
    slug === "research-status" || slug === "evidence-confidence"
      ? characters.length + systems.length + readings.length
      : slug === "queer-readings"
        ? readings.length
      : slug === "system-types" || slug === "affected-scopes" || slug === "player-dependency" || slug === "availability"
        ? systems.length
        : characters.length;

  const result: CategoryBucket[] = Array.from(buckets.entries())
    .map(([key, entries]) => ({
      key,
      label: labelFor(key),
      entries,
      percentage: denominator ? (entries.length / denominator) * 100 : 0,
    }))
    .sort((a, b) => {
      const rank = (key: string) =>
        key === CONDITIONAL_SEXUALITY_KEY ? 1 : key === "not_recorded" ? 2 : 0;
      return (
        rank(a.key) - rank(b.key) ||
        b.entries.length - a.entries.length ||
        a.label.localeCompare(b.label)
      );
    });

  return {
    buckets: result,
    denominator,
    assignments: result.reduce((total, bucket) => total + bucket.entries.length, 0),
  };
}

export default function AnalyticsCategoryDetail({
  slug,
}: {
  slug: AnalyticsCategorySlug;
}) {
  const category = getAnalyticsCategory(slug);
  const [characters, setCharacters] = useState<CharacterRecord[]>([]);
  const [systems, setSystems] = useState<SystemRecord[]>([]);
  const [readings, setReadings] = useState<ReadingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [characterResponse, systemResponse, readingResponse] = await Promise.all([
          fetch("/api/characters", { cache: "no-store" }),
          fetch("/api/systems", { cache: "no-store" }),
          fetch("/api/queer-readings", { cache: "no-store" }),
        ]);
        if (!characterResponse.ok || !systemResponse.ok || !readingResponse.ok) {
          throw new Error("The analytics data could not be loaded.");
        }
        const [characterData, systemData, readingData] = await Promise.all([
          characterResponse.json(),
          systemResponse.json(),
          readingResponse.json(),
        ]);
        if (!active) return;
        setCharacters(characterData.characters || []);
        setSystems(systemData.systems || []);
        setReadings(readingData.readings || []);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "The analytics data could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const data = useMemo(
    () => buildCategoryData(slug, characters, systems, readings),
    [slug, characters, systems, readings],
  );

  if (!category) return null;

  const related = ANALYTICS_CATEGORIES.filter(
    (item) => item.group === category.group && item.slug !== category.slug,
  );

  return (
    <section className="relative px-4 py-10 sm:px-6 md:px-10 md:py-14 lg:px-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(217,70,239,0.1),transparent_28%),radial-gradient(circle_at_88%_12%,rgba(34,211,238,0.1),transparent_26%)]" />
      <div className="relative z-10 mx-auto max-w-[1400px] space-y-7">
        <div className="grid gap-5 lg:grid-cols-3">
          <article className="analytics-definition-card">
            <span>01 · What it means</span>
            <h2>Category definition</h2>
            <p>{category.meaning}</p>
          </article>
          <article className="analytics-definition-card">
            <span>02 · How it is counted</span>
            <h2>Calculation</h2>
            <p>{category.calculation}</p>
          </article>
          <article className="analytics-definition-card">
            <span>03 · Read carefully</span>
            <h2>Interpretation</h2>
            <p>{category.interpretation}</p>
          </article>
        </div>

        <div className="analytics-category-summary-grid">
          <article>
            <strong>{loading ? "—" : data.denominator}</strong>
            <span>Records analyzed</span>
            <p>Percentage base: {category.denominator}.</p>
          </article>
          <article>
            <strong>{loading ? "—" : data.buckets.length}</strong>
            <span>Categories represented</span>
            <p>Includes Not recorded when values are missing.</p>
          </article>
          <article>
            <strong>{loading ? "—" : data.assignments}</strong>
            <span>Category assignments</span>
            <p>{category.multiple ? "Can exceed the record total because categories overlap." : "Normally matches the record total when every field is classified."}</p>
          </article>
        </div>

        {slug === "queer-readings" ? (
          <div className="rounded-[1.5rem] border border-[#8291ff]/25 bg-[#eef0ff] px-5 py-5 sm:px-7">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#4f5fe7]">
              Separate research unit
            </p>
            <h2 className="mt-2 text-xl font-black text-[#15183a] sm:text-2xl">
              Interpretation is not identity confirmation
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-[#5f688e]">
              These records document reception, debate, and creator responses. They never contribute to the gender or sexuality percentages for characters.
            </p>
          </div>
        ) : null}

        {loading ? (
          <div className="analytics-category-state">Loading detailed analytics…</div>
        ) : error ? (
          <div className="analytics-category-state is-error">{error}</div>
        ) : data.buckets.length === 0 ? (
          <div className="analytics-category-state">
            No records have been documented for this category yet. The page is
            ready and will populate automatically when the dataset grows.
          </div>
        ) : (
          <div className="space-y-6">
            {data.buckets.map((bucket, index) => {
              const visible = visibleCounts[bucket.key] || 3;
              const shown = bucket.entries.slice(0, visible);
              const allVisible = visible >= bucket.entries.length;
              const bucketDefinition = getAnalyticsBucketDefinition(
                slug,
                bucket.key,
              );

              return (
                <div key={bucket.key} className="space-y-6">
                  {slug === "sexuality" && bucket.key === CONDITIONAL_SEXUALITY_KEY ? (
                    <div className="rounded-[1.5rem] border border-[#8291ff]/25 bg-[#eef0ff] px-5 py-5 sm:px-7">
                      <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#4f5fe7]">
                        Separate evidence track
                      </p>
                      <h2 className="mt-2 text-xl font-black text-[#15183a] sm:text-2xl">
                        Conditional or player-defined representation
                      </h2>
                      <p className="mt-2 max-w-4xl text-sm leading-6 text-[#5f688e]">
                        These records remain visible for research, but their possible labels do not count as confirmed character identities.
                      </p>
                    </div>
                  ) : null}

                  <article className="analytics-category-bucket">
                  <div className="analytics-category-bucket-heading">
                    <div>
                      <p>Category {String(index + 1).padStart(2, "0")}</p>
                      <h2>{bucket.label}</h2>
                    </div>
                    <div className="analytics-category-count">
                      <strong>{bucket.entries.length}</strong>
                      <span>{bucket.entries.length === 1 ? "record" : "records"}</span>
                    </div>
                  </div>

                  <div className="analytics-category-percentage">
                    <div>
                      <span>{bucket.percentage.toFixed(1)}%</span>
                      <small>of {category.denominator}</small>
                    </div>
                    <div className="analytics-category-progress" aria-label={`${bucket.percentage.toFixed(1)} percent`}>
                      <i style={{ width: `${Math.min(100, bucket.percentage)}%` }} />
                    </div>
                  </div>

                  <section className="mt-6 rounded-[1.5rem] border border-[#dfe3f3] bg-[#f7f8ff] p-4 sm:p-6">
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#4f5fe7]">
                      Category explanation
                    </p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {[
                        ["Definition", bucketDefinition.definition],
                        ["Included when", bucketDefinition.included],
                        ["What it does not establish", bucketDefinition.doesNotMean],
                        ["How to interpret the number", bucketDefinition.interpretation],
                      ].map(([heading, text]) => (
                        <div key={heading} className="rounded-2xl bg-white p-4">
                          <h3 className="text-sm font-black text-[#171b42]">
                            {heading}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-[#626b91]">
                            {text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="mt-6">
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#4f5fe7]">
                      Records included in this number
                    </p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {shown.map((entry) => (
                        <div key={entry.id} className="analytics-example-card">
                          <span>{entry.kind}</span>
                          <h3>{entry.title}</h3>
                          <p className="analytics-example-game">{entry.subtitle}</p>
                          {entry.meta ? <p className="analytics-example-meta">{entry.meta}</p> : null}
                          <p className="analytics-example-detail">{entry.detail}</p>
                        </div>
                      ))}
                    </div>

                    {bucket.entries.length > 3 ? (
                      <button
                        type="button"
                        className="analytics-view-more"
                        onClick={() =>
                          setVisibleCounts((current) => ({
                            ...current,
                            [bucket.key]: allVisible ? 3 : Math.min(bucket.entries.length, visible + 6),
                          }))
                        }
                      >
                        {allVisible
                          ? "Show fewer"
                          : `View more (${bucket.entries.length - shown.length} remaining)`}
                      </button>
                    ) : null}
                  </div>
                  </article>
                </div>
              );
            })}
          </div>
        )}

        <ResearchReferences
          ids={category.sourceIds}
          theme="light"
          title={`Research basis for ${category.menuLabel.toLowerCase()}`}
        />

        {related.length ? (
          <section className="analytics-related-categories">
            <div>
              <p>Continue exploring</p>
              <h2>Related {category.group.toLowerCase()} categories</h2>
            </div>
            <div>
              {related.map((item) => (
                <Link key={item.slug} href={`/analytics/${item.slug}`}>
                  {item.menuLabel} →
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}
