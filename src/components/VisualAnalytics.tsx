"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Character {
  character_name: string;
  game_title: string;
  release_year?: number | null;
  developer?: string;
  playable?: boolean;
  playable_status?: string;
  gender?: string;
  sexuality?: string;
  identity_label?: string[];
  identity_category?: string[];
  intersectionality_present?: string;
  intersectionality_details?: string;
}

interface Props {
  characters: Character[];
}

const COLORS = ["#4f5fe7", "#8192ef", "#8fd9ec", "#b4a7ef", "#6d7de5"];
const BAR_GRADIENT =
  "linear-gradient(90deg, #3545d3, #6172e8 58%, #8fd9ec 82%, #b4a7ef)";
const PANEL_CLASS =
  "pq-panel relative min-w-0 overflow-hidden p-5 sm:p-6";
const EYEBROW_CLASS =
  "font-mono text-[11px] font-black uppercase tracking-[0.22em] text-[#4f5fe7] sm:text-xs sm:tracking-[0.34em]";
const TOOLTIP_STYLE = {
  background: "#ffffff",
  border: "1px solid #dfe3f3",
  borderRadius: 0,
  color: "#12152b",
};

function normalize(value?: string | null) {
  return value?.trim().toLowerCase().replace(/\s+/g, "_") || "";
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function percent(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

function splitValues(value?: string | null) {
  if (!value) return [];

  return value
    .split(";")
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

function StatDonut({
  title,
  count,
  total,
  label,
  sentence,
}: {
  title: string;
  count: number;
  total: number;
  label: string;
  sentence: string;
}) {
  const percentage = percent(count, total);
  const data = [
    { name: label, value: count },
    { name: "Other", value: Math.max(total - count, 0) },
  ];

  return (
    <div className={PANEL_CLASS}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />

      <p className={EYEBROW_CLASS}>{label}</p>
      <h3 className="mt-3 text-left text-xl font-black italic text-white sm:text-2xl">
        {title}
      </h3>

      <div className="relative mx-auto mt-7 h-[190px] w-[190px] sm:mt-8 sm:h-[220px] sm:w-[220px]">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          initialDimension={{ width: 220, height: 220 }}
        >
          <PieChart>
            <Pie
              data={data}
              innerRadius={58}
              outerRadius={82}
              paddingAngle={2}
              dataKey="value"
              stroke="transparent"
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>

            <Tooltip contentStyle={TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl font-black text-white">{percentage}%</p>

            <p
              className={`mx-auto font-mono uppercase leading-tight text-slate-400 ${
                label.length > 12
                  ? "max-w-[78px] text-[7px] tracking-[0.08em]"
                  : "max-w-[96px] text-[9px] tracking-[0.18em]"
              }`}
            >
              {label}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-sm leading-relaxed text-slate-400">
        Out of {total} registered queer characters,{" "}
        <span className="font-bold text-white">{count}</span> {sentence}.
      </p>
    </div>
  );
}

function BreakdownSection({
  title,
  data,
}: {
  title: string;
  data: Record<string, number>;
}) {
  const entries = Object.entries(data);
  const total = entries.reduce((acc, [, count]) => acc + count, 0);

  if (entries.length === 0) {
    return (
      <div className={PANEL_CLASS}>
        <p className={EYEBROW_CLASS}>Breakdown</p>
        <h3 className="mt-3 text-xl font-black italic text-white sm:text-2xl">
          {title}
        </h3>
        <p className="mt-5 text-slate-400">No data registered yet.</p>
      </div>
    );
  }

  return (
    <div className={PANEL_CLASS}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />

      <p className={EYEBROW_CLASS}>Breakdown</p>
      <h3 className="mt-3 text-xl font-black italic text-white sm:text-2xl">
        {title}
      </h3>

      <div className="mt-8 space-y-5">
        {entries.map(([label, count]) => {
          const percentage = percent(count, total);

          return (
            <div key={label}>
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2 text-sm sm:gap-4">
                <span className="min-w-0 break-words text-slate-200">
                  {formatLabel(label)}
                </span>
                <span className="shrink-0 font-mono text-white">
                  {count} - {percentage}%
                </span>
              </div>

              <div className="h-3 overflow-hidden bg-white/10">
                <div
                  className="h-full shadow-[0_0_22px_rgba(34,211,238,0.35)]"
                  style={{
                    width: `${percentage}%`,
                    background: BAR_GRADIENT,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function VisualAnalytics({ characters }: Props) {
  const totalCharacters = characters.length;

  const playableCount = characters.filter(
    (character) =>
      character.playable ||
      normalize(character.playable_status) === "playable"
  ).length;

  const transCount = characters.filter((character) => {
    const labels = [
      character.gender,
      character.sexuality,
      ...(character.identity_label || []),
    ].map(normalize);

    return labels.some((label) => label.includes("trans"));
  }).length;

  const intersectionalCount = characters.filter((character) => {
    const value = normalize(character.intersectionality_present);
    return value.length > 0 && value !== "no" && value !== "none";
  }).length;

  const sexualityMap: Record<string, number> = {};
  const genderMap: Record<string, number> = {};
  const identityCategoryMap: Record<string, number> = {};
  const intersectionalityMap: Record<string, number> = {};
  const yearMap: Record<string, number> = {};
  const studioMap: Record<string, number> = {};

  characters.forEach((character) => {
    if (character.sexuality && normalize(character.sexuality) !== "none") {
      const key = normalize(character.sexuality);
      sexualityMap[key] = (sexualityMap[key] || 0) + 1;
    }

    if (character.gender && normalize(character.gender) !== "none") {
      const key = normalize(character.gender);
      genderMap[key] = (genderMap[key] || 0) + 1;
    }

    (character.identity_category || []).forEach((category) => {
      const key = normalize(category);
      if (!key || key === "none") return;
      identityCategoryMap[key] = (identityCategoryMap[key] || 0) + 1;
    });

    splitValues(character.intersectionality_details).forEach((detail) => {
      const key = normalize(detail);
      if (!key || key === "none") return;
      intersectionalityMap[key] = (intersectionalityMap[key] || 0) + 1;
    });

    const year = character.release_year?.toString() || "Unknown";
    yearMap[year] = (yearMap[year] || 0) + 1;

    if (character.developer) {
      studioMap[character.developer] = (studioMap[character.developer] || 0) + 1;
    }
  });

  const yearData = Object.entries(yearMap)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => Number(a.year) - Number(b.year));

  const topStudios = Object.entries(studioMap)
    .map(([studio, count]) => ({ studio, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 py-4 sm:space-y-6 sm:py-6">
      <div className={`${PANEL_CLASS} text-center`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />

        <p className={EYEBROW_CLASS}>Press Q Dataset Overview</p>

        <h2 className="mt-4 text-6xl font-black italic text-white sm:text-7xl">
          {totalCharacters}
        </h2>

        <p className="mt-2 text-slate-400">
          Queer video game characters registered in the Press Q dataset
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <StatDonut
          title="Playable Characters"
          count={playableCount}
          total={totalCharacters}
          label="Playable"
          sentence="are playable"
        />

        <StatDonut
          title="Trans Representation"
          count={transCount}
          total={totalCharacters}
          label="Trans"
          sentence="are trans"
        />

        <StatDonut
          title="Intersectionality"
          count={intersectionalCount}
          total={totalCharacters}
          label="Intersectionality"
          sentence="have intersectionality registered"
        />
      </div>

      <BreakdownSection title="Sexuality Breakdown" data={sexualityMap} />
      <BreakdownSection title="Gender Breakdown" data={genderMap} />
      <BreakdownSection
        title="Identity Category Breakdown"
        data={identityCategoryMap}
      />
      <BreakdownSection
        title="Intersectionality Breakdown"
        data={intersectionalityMap}
      />

      <div className={PANEL_CLASS}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />

        <p className={EYEBROW_CLASS}>Timeline</p>
        <h3 className="mt-3 text-xl font-black italic text-white sm:text-2xl">
          Representation by Year
        </h3>

        <div className="mt-6 h-[260px] sm:mt-8 sm:h-[320px]">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            initialDimension={{ width: 800, height: 320 }}
          >
            <BarChart data={yearData}>
              <XAxis dataKey="year" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" radius={[0, 0, 0, 0]} fill="#4f5fe7" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={PANEL_CLASS}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />

        <p className={EYEBROW_CLASS}>Studios</p>
        <h3 className="mt-3 text-xl font-black italic text-white sm:text-2xl">
          Top Studios
        </h3>

        <div className="mt-8 space-y-5">
          {topStudios.map((studio) => {
            const percentage = percent(studio.count, totalCharacters);

            return (
              <div key={studio.studio}>
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2 text-sm sm:gap-4">
                  <span className="min-w-0 break-words text-slate-200">
                    {studio.studio}
                  </span>
                  <span className="shrink-0 font-mono text-white">
                    {studio.count} - {percentage}%
                  </span>
                </div>

                <div className="h-3 overflow-hidden bg-white/10">
                  <div
                    className="h-full shadow-[0_0_22px_rgba(34,211,238,0.35)]"
                    style={{
                      width: `${percentage}%`,
                      background: BAR_GRADIENT,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
