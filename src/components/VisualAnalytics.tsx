"use client";

import { useMemo, useRef, useState } from "react";
import type { CSSProperties, RefObject } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface AnalyticsCharacter {
  character_name: string;
  game_title: string;
  release_year?: number | null;
  developer?: string;
  game_scale?: string;
  playable?: boolean;
  playable_status?: string;
  gender?: string;
  sexuality?: string;
  identity_label?: string[];
  identity_category?: string[];
  intersectionality_present?: string;
  research_status?: string;
  evidence_confidence?: string;
  source_language?: string;
}

export interface AnalyticsSystem {
  system_id: string;
  game_title: string;
  release_year?: number | null;
  system_type: string;
  scope?: string;
  player_dependency?: string;
  availability?: string;
  research_status?: string;
  evidence_confidence?: string;
  source_language?: string;
}

interface Props {
  characters: AnalyticsCharacter[];
  systems: AnalyticsSystem[];
}

type Lens = "characters" | "systems" | "coverage";
type CountMap = Record<string, number>;

const COLORS = ["#8291ff", "#59d8ef", "#ff6fae", "#f8d86f", "#aa8cff"];
const PANEL =
  "pq-data-panel relative min-w-0 overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#111743]/92 p-5 shadow-[0_24px_70px_rgba(6,9,36,0.28)] sm:p-7";
const EYEBROW =
  "font-mono text-[10px] font-black uppercase tracking-[0.24em] text-[#83e9f5] sm:text-[11px]";
const TOOLTIP_STYLE = {
  background: "#111743",
  border: "1px solid rgba(131,233,245,.32)",
  borderRadius: 14,
  color: "#fff",
};

const LABELS: Record<string, string> = {
  aaa: "AAA",
  aa: "AA",
  indie: "Independent",
  mobile: "Mobile",
  browser: "Browser",
  reviewed: "Reviewed",
  in_progress: "In research",
  identified: "Identified / queued",
  needs_verification: "Needs verification",
  high: "High",
  medium: "Medium",
  low: "Low",
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
  optional: "Optional",
  conditional: "Conditional",
  expansion: "Expansion / DLC",
  mod_only: "Mods only",
  gender_identity: "Gender identity",
  sexual_orientation: "Sexual orientation",
  romantic_orientation: "Romantic orientation",
  intersex_variation: "Intersex variation",
  gender_expression: "Gender expression",
  person_of_color: "Person of color",
  nationality_migration: "Nationality / migration",
  non_binary: "Nonbinary",
  trans_woman: "Trans woman",
  trans_man: "Trans man",
};

function splitValues(value?: string | null) {
  if (!value) return [];
  return value
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalize(value?: string | null) {
  return value?.trim().toLowerCase().replace(/[\s-]+/g, "_") || "";
}

function labelFor(value: string) {
  return (
    LABELS[value] ||
    value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function increment(map: CountMap, rawValue?: string | null) {
  splitValues(rawValue).forEach((value) => {
    const key = normalize(value);
    if (!key || key === "unknown" || key === "no") return;
    map[key] = (map[key] || 0) + 1;
  });
}

function incrementArray(map: CountMap, values?: string[]) {
  values?.forEach((value) => increment(map, value));
}

function sortedData(map: CountMap, limit = 12) {
  return Object.entries(map)
    .map(([key, value]) => ({ key, name: labelFor(key), value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function serializeSvg(svg: SVGSVGElement) {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  const rect = svg.getBoundingClientRect();
  copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  copy.setAttribute("width", String(Math.max(Math.round(rect.width), 900)));
  copy.setAttribute("height", String(Math.max(Math.round(rect.height), 500)));
  copy.setAttribute(
    "style",
    "background:#111743;color:#fff;font-family:Arial,sans-serif",
  );
  return new XMLSerializer().serializeToString(copy);
}

async function svgToPng(
  svgText: string,
  filename: string,
  width = 1600,
  height = 1000,
) {
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const image = new Image();

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () =>
      reject(new Error("Could not render the chart."));
    image.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.fillStyle = "#0a0f35";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  URL.revokeObjectURL(url);

  const png = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png", 1),
  );
  if (png) downloadBlob(png, filename);
}

function ExportControls({
  targetRef,
  filename,
}: {
  targetRef: RefObject<HTMLDivElement | null>;
  filename: string;
}) {
  function getSvg() {
    return targetRef.current?.querySelector("svg") || null;
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button
        type="button"
        className="pq-chart-download"
        onClick={() => {
          const svg = getSvg();
          if (!svg) return;
          downloadBlob(
            new Blob([serializeSvg(svg)], { type: "image/svg+xml" }),
            `${filename}.svg`,
          );
        }}
      >
        SVG ↓
      </button>
      <button
        type="button"
        className="pq-chart-download"
        onClick={() => {
          const svg = getSvg();
          if (!svg) return;
          void svgToPng(serializeSvg(svg), `${filename}.png`);
        }}
      >
        PNG ↓
      </button>
    </div>
  );
}

function BarPanel({
  eyebrow,
  title,
  description,
  countingNote,
  data,
  filename,
}: {
  eyebrow: string;
  title: string;
  description: string;
  countingNote?: string;
  data: ReturnType<typeof sortedData>;
  filename: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const height = Math.max(260, data.length * 46);

  return (
    <section className={PANEL}>
      <div className="pq-data-prism" aria-hidden="true" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className={EYEBROW}>{eyebrow}</p>
          <h3 className="mt-2 text-xl font-black italic text-white sm:text-2xl">
            {title}
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            {description}
          </p>
        </div>
        <ExportControls targetRef={ref} filename={filename} />
      </div>

      {data.length ? (
        <div ref={ref} className="mt-6" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 4, right: 24 }}
            >
              <XAxis type="number" allowDecimals={false} stroke="#b5bee3" />
              <YAxis
                type="category"
                dataKey="name"
                width={145}
                tick={{ fill: "#dce2ff", fontSize: 11 }}
                stroke="#b5bee3"
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={{ fill: "rgba(255,255,255,.04)" }}
              />
              <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={entry.key}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-white/15 p-5 text-sm text-slate-400">
          No data has been documented for this view yet.
        </p>
      )}

      <p className="mt-4 border-t border-white/10 pt-4 text-xs leading-5 text-[#9da8d1]">
        <strong className="text-[#83e9f5]">How to read:</strong>{" "}
        Each bar shows the number of documented records in that category.
        {countingNote ? ` ${countingNote}` : ""} Empty, unknown, and explicitly
        undocumented values are not shown.
      </p>
    </section>
  );
}

function OrbitOverview({
  characters,
  systems,
  reviewed,
  languages,
}: {
  characters: number;
  systems: number;
  reviewed: number;
  languages: number;
}) {
  const nodes = [
    {
      id: "characters",
      label: "Characters",
      value: characters,
      description:
        "Character-level records in the Press Q dataset. A character appearing in one game counts as one unit.",
      x: "50%",
      y: "4%",
      color: "#8291ff",
    },
    {
      id: "systems",
      label: "Systems",
      value: systems,
      description:
        "Documented queer affordances or game systems. One game can contribute several separate system records.",
      x: "88%",
      y: "44%",
      color: "#59d8ef",
    },
    {
      id: "reviewed",
      label: "Reviewed",
      value: reviewed,
      description:
        "Character and system records whose research status is marked Reviewed.",
      x: "67%",
      y: "84%",
      color: "#f8d86f",
    },
    {
      id: "languages",
      label: "Source languages",
      value: languages,
      description:
        "Distinct non-empty language codes recorded for the sources used across both datasets.",
      x: "13%",
      y: "61%",
      color: "#ff6fae",
    },
  ];
  const [active, setActive] = useState(nodes[0]);

  return (
    <section
      className={`${PANEL} pq-orbit-panel lg:grid lg:grid-cols-[minmax(360px,.9fr)_minmax(280px,.55fr)] lg:items-center lg:gap-8`}
    >
      <div className="relative mx-auto aspect-square w-full max-w-[520px]">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 520 520"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="orbit-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8291ff" />
              <stop offset=".48" stopColor="#59d8ef" />
              <stop offset="1" stopColor="#ff6fae" />
            </linearGradient>
          </defs>
          <circle
            cx="260"
            cy="260"
            r="194"
            fill="none"
            stroke="url(#orbit-gradient)"
            strokeOpacity=".36"
            strokeWidth="2"
            strokeDasharray="8 12"
          />
          <circle
            cx="260"
            cy="260"
            r="130"
            fill="none"
            stroke="#ffffff"
            strokeOpacity=".12"
          />
          <circle
            cx="260"
            cy="260"
            r="76"
            fill="url(#orbit-gradient)"
            fillOpacity=".12"
            stroke="#83e9f5"
            strokeOpacity=".5"
          />
          <path
            d="M125 142C205 80 332 79 408 151M115 357C208 438 351 427 415 337"
            fill="none"
            stroke="#fff"
            strokeOpacity=".09"
            strokeWidth="20"
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute inset-[35%] grid place-items-center rounded-full text-center">
          <span className="text-4xl font-black italic text-white sm:text-5xl">
            {characters + systems}
          </span>
          <span className="font-mono text-[8px] font-black uppercase tracking-[.2em] text-[#83e9f5]">
            documented units
          </span>
        </div>

        {nodes.map((node) => (
          <button
            key={node.id}
            type="button"
            onClick={() => setActive(node)}
            className={`pq-orbit-node ${active.id === node.id ? "is-active" : ""}`}
            style={
              {
                left: node.x,
                top: node.y,
                "--node-color": node.color,
              } as CSSProperties
            }
            aria-pressed={active.id === node.id}
          >
            <strong>{node.value}</strong>
            <span>{node.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 lg:mt-0">
        <p className={EYEBROW}>Living archive map</p>
        <h2 className="mt-3 text-3xl font-black italic text-white sm:text-4xl">
          Data in orbit
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
          Characters and systems are different units. The map preserves that
          distinction and also shows the research stage — it does not estimate
          the percentage of all existing games.
        </p>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.045] p-5">
          <p className="font-mono text-[10px] font-black uppercase tracking-[.2em] text-[#83e9f5]">
            Selected view
          </p>
          <p
            className="mt-2 text-3xl font-black"
            style={{ color: active.color }}
          >
            {active.value}
          </p>
          <p className="mt-1 font-bold text-slate-300">{active.label}</p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {active.description}
          </p>
        </div>
      </div>
    </section>
  );
}

function escapeXml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[character] || character,
  );
}

function buildInfographic(
  title: string,
  subtitle: string,
  metrics: { label: string; value: number }[],
  bars: { name: string; value: number }[],
) {
  const max = Math.max(...bars.map((bar) => bar.value), 1);
  const metricCards = metrics
    .map((metric, index) => {
      const x = 90 + index * 350;
      return `<g transform="translate(${x} 250)"><rect width="310" height="155" rx="28" fill="#151d55" stroke="#ffffff" stroke-opacity=".12"/><text x="25" y="48" fill="#83e9f5" font-size="18" font-weight="700">${escapeXml(metric.label.toUpperCase())}</text><text x="25" y="118" fill="#ffffff" font-size="64" font-weight="900">${metric.value}</text></g>`;
    })
    .join("");
  const rows = bars
    .slice(0, 7)
    .map((bar, index) => {
      const y = 500 + index * 70;
      const width = Math.max(12, (bar.value / max) * 850);
      return `<text x="90" y="${y + 22}" fill="#dce2ff" font-size="22">${escapeXml(bar.name)}</text><rect x="460" y="${y}" width="${width}" height="34" rx="17" fill="${COLORS[index % COLORS.length]}"/><text x="${Math.min(1340, 480 + width)}" y="${y + 24}" fill="#ffffff" font-size="20" font-weight="700">${bar.value}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100" viewBox="0 0 1600 1100"><defs><radialGradient id="bg"><stop stop-color="#242e86"/><stop offset="1" stop-color="#080d30"/></radialGradient></defs><rect width="1600" height="1100" fill="url(#bg)"/><circle cx="1430" cy="110" r="240" fill="#59d8ef" fill-opacity=".08"/><circle cx="120" cy="1040" r="310" fill="#ff6fae" fill-opacity=".07"/><text x="90" y="95" fill="#83e9f5" font-size="20" font-weight="800" letter-spacing="7">PRESS Q · DATA LENS</text><text x="90" y="175" fill="#ffffff" font-size="62" font-style="italic" font-weight="900">${escapeXml(title)}</text><text x="90" y="215" fill="#b8c1eb" font-size="21">${escapeXml(subtitle)}</text>${metricCards}${rows}<text x="90" y="1050" fill="#929cc8" font-size="17">Counts from the documented corpus · do not represent prevalence across all games.</text></svg>`;
}

export default function VisualAnalytics({ characters, systems }: Props) {
  const [lens, setLens] = useState<Lens>("characters");

  const data = useMemo(() => {
    const maps = {
      gender: {} as CountMap,
      sexuality: {} as CountMap,
      identity: {} as CountMap,
      intersectionality: {} as CountMap,
      scale: {} as CountMap,
      systemType: {} as CountMap,
      scope: {} as CountMap,
      dependency: {} as CountMap,
      availability: {} as CountMap,
      status: {} as CountMap,
      confidence: {} as CountMap,
      language: {} as CountMap,
    };

    characters.forEach((character) => {
      increment(maps.gender, character.gender);
      increment(maps.sexuality, character.sexuality);
      incrementArray(maps.identity, character.identity_category);
      increment(maps.intersectionality, character.intersectionality_present);
      increment(maps.scale, character.game_scale);
      increment(maps.status, character.research_status);
      increment(maps.confidence, character.evidence_confidence);
      increment(maps.language, character.source_language);
    });

    systems.forEach((system) => {
      increment(maps.systemType, system.system_type);
      increment(maps.scope, system.scope);
      increment(maps.dependency, system.player_dependency);
      increment(maps.availability, system.availability);
      increment(maps.status, system.research_status);
      increment(maps.confidence, system.evidence_confidence);
      increment(maps.language, system.source_language);
    });

    const playable = characters.filter(
      (character) =>
        character.playable ||
        normalize(character.playable_status) === "playable",
    ).length;
    const reviewed = maps.status.reviewed || 0;
    const uniqueGames = new Set([
      ...characters.map((character) => normalize(character.game_title)),
      ...systems.map((system) => normalize(system.game_title)),
    ]).size;

    return { maps, playable, reviewed, uniqueGames };
  }, [characters, systems]);

  const lensBars =
    lens === "characters"
      ? sortedData(data.maps.sexuality)
      : lens === "systems"
        ? sortedData(data.maps.systemType)
        : sortedData(data.maps.status);
  const infographic = buildInfographic(
    lens === "characters"
      ? "Archive characters"
      : lens === "systems"
        ? "Queer systems"
        : "Research coverage",
    lens === "characters"
      ? "Documented identities and markers"
      : lens === "systems"
        ? "What games allow players to create, choose, and experience"
        : "Status, confidence, and source languages",
    [
      { label: "Characters", value: characters.length },
      { label: "Systems", value: systems.length },
      { label: "Unique games", value: data.uniqueGames },
      { label: "Reviewed", value: data.reviewed },
    ],
    lensBars,
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 py-4 sm:py-7">
      <OrbitOverview
        characters={characters.length}
        systems={systems.length}
        reviewed={data.reviewed}
        languages={Object.keys(data.maps.language).length}
      />

      <section className="rounded-[1.5rem] border border-[#8291ff]/20 bg-[#111743] p-5 text-[#d9def5] sm:p-6">
        <p className={EYEBROW}>How to read this page</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
            <h3 className="font-black text-white">Counts, not prevalence</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Every number describes records currently documented by Press Q.
              It is not an estimate of all queer games or characters.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
            <h3 className="font-black text-white">Different units stay separate</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              A character is one representation record; a system is one game
              affordance. A single game may contain several of either.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
            <h3 className="font-black text-white">Multiple tags can overlap</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              A record with several identities, markers, scopes, or languages
              is counted once in every relevant bar.
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-[#111743] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-2 sm:grid-cols-3">
          {(["characters", "systems", "coverage"] as Lens[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLens(item)}
              className={`rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-[.12em] transition ${
                lens === item
                  ? "bg-[#8291ff] text-white shadow-[0_8px_26px_rgba(79,95,231,.35)]"
                  : "text-[#b5bee3] hover:bg-white/[.06] hover:text-white"
              }`}
            >
              {item === "characters"
                ? "Characters"
                : item === "systems"
                  ? "Systems"
                  : "Coverage"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 px-1">
          <button
            type="button"
            className="pq-chart-download"
            onClick={() =>
              downloadBlob(
                new Blob([infographic], { type: "image/svg+xml" }),
                `pressq-${lens}.svg`,
              )
            }
          >
            Generate SVG infographic ↓
          </button>
          <button
            type="button"
            className="pq-chart-download"
            onClick={() =>
              void svgToPng(
                infographic,
                `pressq-${lens}.png`,
                1600,
                1100,
              )
            }
          >
            Generate PNG ↓
          </button>
        </div>
      </div>

      {lens === "characters" ? (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <MetricCard
              label="Characters"
              value={characters.length}
              definition="Character-level records currently documented in the Press Q dataset. This is not a count of unique games."
            />
            <MetricCard
              label="Playable"
              value={data.playable}
              definition="Character records marked playable through either the playable flag or the playable-status field."
            />
            <MetricCard
              label="Games"
              value={data.uniqueGames}
              definition="Distinct normalized game titles found across both the character and queer-system datasets."
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <BarPanel
              eyebrow="Identity"
              title="Gender / gender identity"
              description="Counts character records by their documented gender or gender identity tags."
              countingNote="A character with more than one documented identity appears in each applicable bar."
              data={sortedData(data.maps.gender)}
              filename="pressq-gender"
            />
            <BarPanel
              eyebrow="Identity"
              title="Sexuality"
              description="Counts character records by documented sexual-orientation or sexuality tags."
              countingNote="Composite identities contribute once to every selected category."
              data={sortedData(data.maps.sexuality)}
              filename="pressq-sexuality"
            />
            <BarPanel
              eyebrow="Categories"
              title="Identity categories"
              description="Groups records by broad analytical dimensions such as gender identity, sexual orientation, or romantic orientation. These categories do not replace a character’s own identity terms."
              countingNote="One record can belong to several analytical categories."
              data={sortedData(data.maps.identity)}
              filename="pressq-identity-categories"
            />
            <BarPanel
              eyebrow="Intersectionality"
              title="Documented markers"
              description="Counts explicitly recorded contextual markers such as race, ethnicity, disability, class, religion, or nationality and migration."
              countingNote="Absence from the chart means not documented in the field, not that the marker is absent from the character."
              data={sortedData(data.maps.intersectionality)}
              filename="pressq-intersectionality"
            />
            <BarPanel
              eyebrow="Production"
              title="Game scale"
              description="Counts character records by the recorded production scale of their game, such as AAA, AA, independent, mobile, browser, or student/amateur."
              countingNote="This counts character records, so a game with several documented characters contributes several times."
              data={sortedData(data.maps.scale)}
              filename="pressq-game-scale"
            />
          </div>
        </>
      ) : null}

      {lens === "systems" ? (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <MetricCard
              label="Systems"
              value={systems.length}
              definition="Individual records of queer possibilities or affordances provided by a game. A game may have several system records."
            />
            <MetricCard
              label="Games"
              value={
                new Set(
                  systems.map((system) => normalize(system.game_title)),
                ).size
              }
              definition="Distinct game titles that currently have at least one documented queer-system record."
            />
            <MetricCard
              label="Types"
              value={Object.keys(data.maps.systemType).length}
              definition="Distinct system-type categories represented in the current queer-systems dataset."
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <BarPanel
              eyebrow="Affordances"
              title="System types"
              description="Counts records by what the game allows, such as character creation, pronoun selection, same-gender romance, or queer family creation."
              data={sortedData(data.maps.systemType)}
              filename="pressq-system-types"
            />
            <BarPanel
              eyebrow="Multiple choice"
              title="Affected scopes"
              description="Counts which parts of the game are affected: the player avatar, NPCs, relationships, family systems, or the wider game world."
              countingNote="A system that affects several scopes contributes once to each selected scope."
              data={sortedData(data.maps.scope)}
              filename="pressq-scopes"
            />
            <BarPanel
              eyebrow="Agency"
              title="Player dependency"
              description="Shows how much the queer experience depends on player choice: none, partial, or full dependency."
              data={sortedData(data.maps.dependency)}
              filename="pressq-player-dependency"
            />
            <BarPanel
              eyebrow="Access"
              title="Availability"
              description="Shows how the system becomes available: by default, optionally, conditionally, through an expansion or DLC, or only through mods."
              data={sortedData(data.maps.availability)}
              filename="pressq-availability"
            />
          </div>
        </>
      ) : null}

      {lens === "coverage" ? (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <MetricCard
              label="Reviewed"
              value={data.reviewed}
              definition="Character and system records marked Reviewed in the research-status field."
            />
            <MetricCard
              label="Source languages"
              value={Object.keys(data.maps.language).length}
              definition="Distinct non-empty source-language codes across both datasets. This measures language variety, not the number of sources."
            />
            <MetricCard
              label="No status"
              value={
                characters.length +
                systems.length -
                Object.values(data.maps.status).reduce(
                  (sum, count) => sum + count,
                  0,
                )
              }
              definition="Character and system records without a recognized research-status value. These records still require workflow classification."
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <BarPanel
              eyebrow="Progress"
              title="Research status"
              description="Counts records at each workflow stage: identified or queued, in research, reviewed, or needing verification."
              data={sortedData(data.maps.status)}
              filename="pressq-research-status"
            />
            <BarPanel
              eyebrow="Evidence"
              title="Recorded confidence"
              description="Counts records by the curator’s confidence in the available evidence: low, medium, or high. Confidence describes evidence quality, not the importance of the representation."
              data={sortedData(data.maps.confidence)}
              filename="pressq-evidence-confidence"
            />
            <BarPanel
              eyebrow="Gaps"
              title="Source languages"
              description="Counts records by the language of the source used to document them. This makes language concentration and under-researched languages visible."
              countingNote="A record with more than one source language contributes to each listed language."
              data={sortedData(data.maps.language)}
              filename="pressq-source-languages"
            />
          </div>
        </>
      ) : null}

      <p className="rounded-2xl border border-[#8291ff]/25 bg-[#111743] px-5 py-4 text-xs font-medium leading-6 text-[#b5bee3]">
        All counts describe only the corpus documented by Press Q. Bar charts
        omit empty, unknown, and explicitly undocumented values. Composite or
        multi-select records are counted in every applicable category while
        remaining one record in the overall total.
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  definition,
}: {
  label: string;
  value: number;
  definition: string;
}) {
  return (
    <article className={`${PANEL} min-h-44`}>
      <div className="pq-data-prism" aria-hidden="true" />
      <p className={EYEBROW}>{label}</p>
      <p className="mt-4 text-5xl font-black italic text-white">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{definition}</p>
    </article>
  );
}
