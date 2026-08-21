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
  indie: "Independente",
  mobile: "Mobile",
  browser: "Browser",
  reviewed: "Revisado",
  in_progress: "Em pesquisa",
  identified: "Identificado / na fila",
  needs_verification: "Precisa de verificação",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
  character_creation: "Criação de personagem",
  gender_customization: "Customização de gênero",
  pronoun_selection: "Seleção de pronomes",
  sexuality_customization: "Customização de sexualidade",
  same_gender_romance: "Romance entre mesmo gênero",
  gender_independent_romance: "Romance independente de gênero",
  same_gender_marriage: "Casamento entre mesmo gênero",
  queer_family_creation: "Criação de família queer",
  relationship_system: "Sistema de relacionamentos",
  player_avatar: "Avatar do jogador",
  npc: "NPCs",
  relationships: "Relacionamentos",
  family: "Família",
  world: "Mundo do jogo",
  none: "Nenhuma",
  partial: "Parcial",
  full: "Total",
  default: "Padrão",
  optional: "Opcional",
  conditional: "Condicional",
  expansion: "Expansão / DLC",
  mod_only: "Somente por mod",
  gender_identity: "Identidade de gênero",
  sexual_orientation: "Orientação sexual",
  romantic_orientation: "Orientação romântica",
  intersex_variation: "Variação intersexo",
  gender_expression: "Expressão de gênero",
  person_of_color: "Pessoa racializada",
  nationality_migration: "Nacionalidade / migração",
  non_binary: "Não binárie",
  trans_woman: "Mulher trans",
  trans_man: "Homem trans",
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
      reject(new Error("Não foi possível renderizar o gráfico."));
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
  data,
  filename,
}: {
  eyebrow: string;
  title: string;
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
          Ainda não há dados documentados para este recorte.
        </p>
      )}
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
      label: "Personagens",
      value: characters,
      x: "50%",
      y: "4%",
      color: "#8291ff",
    },
    {
      id: "systems",
      label: "Sistemas",
      value: systems,
      x: "88%",
      y: "44%",
      color: "#59d8ef",
    },
    {
      id: "reviewed",
      label: "Revisados",
      value: reviewed,
      x: "67%",
      y: "84%",
      color: "#f8d86f",
    },
    {
      id: "languages",
      label: "Idiomas-fonte",
      value: languages,
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
            unidades documentadas
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
        <p className={EYEBROW}>Mapa vivo do arquivo</p>
        <h2 className="mt-3 text-3xl font-black italic text-white sm:text-4xl">
          Dados em órbita
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
          Personagens e sistemas são unidades diferentes. O mapa preserva essa
          distinção e mostra também o estágio da pesquisa — ele não estima a
          porcentagem de todos os jogos existentes.
        </p>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.045] p-5">
          <p className="font-mono text-[10px] font-black uppercase tracking-[.2em] text-[#83e9f5]">
            Recorte selecionado
          </p>
          <p
            className="mt-2 text-3xl font-black"
            style={{ color: active.color }}
          >
            {active.value}
          </p>
          <p className="mt-1 font-bold text-slate-300">{active.label}</p>
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

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100" viewBox="0 0 1600 1100"><defs><radialGradient id="bg"><stop stop-color="#242e86"/><stop offset="1" stop-color="#080d30"/></radialGradient></defs><rect width="1600" height="1100" fill="url(#bg)"/><circle cx="1430" cy="110" r="240" fill="#59d8ef" fill-opacity=".08"/><circle cx="120" cy="1040" r="310" fill="#ff6fae" fill-opacity=".07"/><text x="90" y="95" fill="#83e9f5" font-size="20" font-weight="800" letter-spacing="7">PRESS Q · DATA LENS</text><text x="90" y="175" fill="#ffffff" font-size="62" font-style="italic" font-weight="900">${escapeXml(title)}</text><text x="90" y="215" fill="#b8c1eb" font-size="21">${escapeXml(subtitle)}</text>${metricCards}${rows}<text x="90" y="1050" fill="#929cc8" font-size="17">Contagens do corpus documentado · não representam a prevalência em todos os jogos.</text></svg>`;
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
      ? "Personagens do arquivo"
      : lens === "systems"
        ? "Sistemas queer"
        : "Cobertura da pesquisa",
    lens === "characters"
      ? "Identidades e marcadores documentados"
      : lens === "systems"
        ? "O que os jogos permitem criar, escolher e viver"
        : "Status, confiança e idiomas das fontes",
    [
      { label: "Personagens", value: characters.length },
      { label: "Sistemas", value: systems.length },
      { label: "Jogos únicos", value: data.uniqueGames },
      { label: "Revisados", value: data.reviewed },
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
                ? "Personagens"
                : item === "systems"
                  ? "Sistemas"
                  : "Cobertura"}
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
            Gerar infográfico SVG ↓
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
            Gerar PNG ↓
          </button>
        </div>
      </div>

      {lens === "characters" ? (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <MetricCard
              label="Personagens"
              value={characters.length}
              note="unidades no nível de personagem"
            />
            <MetricCard
              label="Jogáveis"
              value={data.playable}
              note="dentro do corpus de personagens"
            />
            <MetricCard
              label="Jogos"
              value={data.uniqueGames}
              note="títulos únicos nos dois datasets"
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <BarPanel
              eyebrow="Identidade"
              title="Gênero / identidade de gênero"
              data={sortedData(data.maps.gender)}
              filename="pressq-genero"
            />
            <BarPanel
              eyebrow="Identidade"
              title="Sexualidade"
              data={sortedData(data.maps.sexuality)}
              filename="pressq-sexualidade"
            />
            <BarPanel
              eyebrow="Categorias"
              title="Categorias de identidade"
              data={sortedData(data.maps.identity)}
              filename="pressq-categorias-identidade"
            />
            <BarPanel
              eyebrow="Interseccionalidade"
              title="Marcadores documentados"
              data={sortedData(data.maps.intersectionality)}
              filename="pressq-interseccionalidade"
            />
            <BarPanel
              eyebrow="Produção"
              title="Escala do jogo"
              data={sortedData(data.maps.scale)}
              filename="pressq-escala-jogo"
            />
          </div>
        </>
      ) : null}

      {lens === "systems" ? (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <MetricCard
              label="Sistemas"
              value={systems.length}
              note="linhas de affordances queer"
            />
            <MetricCard
              label="Jogos"
              value={
                new Set(
                  systems.map((system) => normalize(system.game_title)),
                ).size
              }
              note="títulos com sistemas documentados"
            />
            <MetricCard
              label="Tipos"
              value={Object.keys(data.maps.systemType).length}
              note="possibilidades distintas"
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <BarPanel
              eyebrow="Affordances"
              title="Tipos de sistema"
              data={sortedData(data.maps.systemType)}
              filename="pressq-tipos-sistema"
            />
            <BarPanel
              eyebrow="Múltipla escolha"
              title="Escopos afetados"
              data={sortedData(data.maps.scope)}
              filename="pressq-escopos"
            />
            <BarPanel
              eyebrow="Agência"
              title="Dependência do jogador"
              data={sortedData(data.maps.dependency)}
              filename="pressq-dependencia-jogador"
            />
            <BarPanel
              eyebrow="Acesso"
              title="Disponibilidade"
              data={sortedData(data.maps.availability)}
              filename="pressq-disponibilidade"
            />
          </div>
        </>
      ) : null}

      {lens === "coverage" ? (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <MetricCard
              label="Revisados"
              value={data.reviewed}
              note="personagens + sistemas"
            />
            <MetricCard
              label="Idiomas-fonte"
              value={Object.keys(data.maps.language).length}
              note="lacunas linguísticas visíveis"
            />
            <MetricCard
              label="Sem status"
              value={
                characters.length +
                systems.length -
                Object.values(data.maps.status).reduce(
                  (sum, count) => sum + count,
                  0,
                )
              }
              note="registros a classificar"
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <BarPanel
              eyebrow="Andamento"
              title="Status da pesquisa"
              data={sortedData(data.maps.status)}
              filename="pressq-status-pesquisa"
            />
            <BarPanel
              eyebrow="Evidência"
              title="Confiança registrada"
              data={sortedData(data.maps.confidence)}
              filename="pressq-confianca-evidencia"
            />
            <BarPanel
              eyebrow="Lacunas"
              title="Idiomas das fontes"
              data={sortedData(data.maps.language)}
              filename="pressq-idiomas-fontes"
            />
          </div>
        </>
      ) : null}

      <p className="rounded-2xl border border-[#8291ff]/25 bg-[#111743] px-5 py-4 text-xs font-medium leading-6 text-[#b5bee3]">
        As porcentagens e contagens descrevem somente o corpus documentado pelo
        Press Q. Uma identidade composta conta em cada categoria selecionada,
        mas continua sendo um único personagem no total geral.
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note: string;
}) {
  return (
    <article className={`${PANEL} min-h-44`}>
      <div className="pq-data-prism" aria-hidden="true" />
      <p className={EYEBROW}>{label}</p>
      <p className="mt-4 text-5xl font-black italic text-white">{value}</p>
      <p className="mt-3 text-sm text-slate-400">{note}</p>
    </article>
  );
}
