"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  source_language?: string;
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
  source_language?: string;
};

type ExampleRecord = {
  id: string;
  kind: "Character" | "System";
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
  nationality_migration: "Nationality / migration",
  non_binary: "Nonbinary",
  trans_woman: "Trans woman",
  trans_man: "Trans man",
};

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

function intersectionValues(character: CharacterRecord) {
  const raw = [
    ...(character.intersectionality || []),
    ...splitValues(character.intersectionality_present),
  ];
  const normalized = raw.map(normalize).filter(Boolean);
  const explicit = raw.filter((value) => {
    const key = normalize(value);
    return key && !["yes", "no", "unknown", "none"].includes(key);
  });

  if (explicit.length) return explicit;
  if (normalized.includes("no")) return ["none_documented"];

  if (normalized.includes("yes")) {
    const details = splitValues(character.intersectionality_details).filter(
      (value) => !["none", "no"].includes(normalize(value)),
    );
    return details.length ? details : ["documented_unspecified"];
  }

  return ["not_recorded"];
}

function buildCategoryData(
  slug: AnalyticsCategorySlug,
  characters: CharacterRecord[],
  systems: SystemRecord[],
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
  const combinedField = (
    characterValues: (character: CharacterRecord) => string[],
    systemValues: (system: SystemRecord) => string[],
  ) => {
    characterField(characterValues);
    systemField(systemValues);
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
      characterField((character) => splitValues(character.sexuality));
      break;
    case "identity-categories":
      characterField((character) => character.identity_category || []);
      break;
    case "intersectionality":
      characterField(intersectionValues);
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
    case "research-status":
      combinedField(
        (character) => splitValues(character.research_status),
        (system) => splitValues(system.research_status),
      );
      break;
    case "evidence-confidence":
      combinedField(
        (character) => splitValues(character.evidence_confidence),
        (system) => splitValues(system.evidence_confidence),
      );
      break;
    case "source-languages":
      combinedField(
        (character) => splitValues(character.source_language),
        (system) => splitValues(system.source_language),
      );
      break;
  }

  const denominator =
    slug === "research-status" || slug === "evidence-confidence" || slug === "source-languages"
      ? characters.length + systems.length
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
    .sort((a, b) => b.entries.length - a.entries.length || a.label.localeCompare(b.label));

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [characterResponse, systemResponse] = await Promise.all([
          fetch("/api/characters", { cache: "no-store" }),
          fetch("/api/systems", { cache: "no-store" }),
        ]);
        if (!characterResponse.ok || !systemResponse.ok) {
          throw new Error("The analytics data could not be loaded.");
        }
        const [characterData, systemData] = await Promise.all([
          characterResponse.json(),
          systemResponse.json(),
        ]);
        if (!active) return;
        setCharacters(characterData.characters || []);
        setSystems(systemData.systems || []);
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
    () => buildCategoryData(slug, characters, systems),
    [slug, characters, systems],
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

              return (
                <article key={bucket.key} className="analytics-category-bucket">
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
              );
            })}
          </div>
        )}

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
      </div>
    </section>
  );
}
