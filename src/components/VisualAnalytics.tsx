"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
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

const COLORS = ["#d946ef", "#22d3ee", "#8b5cf6", "#ec4899"];

function normalize(value?: string | null) {
  return value?.trim().toLowerCase().replace(/\s+/g, "_") || "";
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
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
  const percentage = total === 0 ? 0 : Math.round((count / total) * 100);

  const data = [
    {
      name: label,
      value: count,
    },
    {
      name: "Other",
      value: total - count,
    },
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <h3 className="text-left text-2xl font-black text-white">{title}</h3>

      <div className="relative mx-auto mt-8 h-[220px] w-[220px]">
        <ResponsiveContainer width="100%" height="100%">
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
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-3xl font-black text-white">
              {percentage}%
            </p>

            <p
              className={`mx-auto uppercase leading-tight text-slate-400 ${
                label.length > 12
                  ? "max-w-[70px] text-[6px] tracking-[0.08em]"
                  : "max-w-[90px] text-[9px] tracking-[0.18em]"
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
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <h3 className="text-2xl font-black text-white">{title}</h3>

        <p className="mt-5 text-slate-400">
          No data registered yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <h3 className="text-2xl font-black text-white">{title}</h3>

      <div className="mt-8 space-y-5">
        {entries.map(([label, count], index) => {
          const percentage = Math.round((count / total) * 100);

          return (
            <div key={label}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-200">
                  {formatLabel(label)}
                </span>

                <span className="text-white">
                  {count} · {percentage}%
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${percentage}%`,
                    background:
                      COLORS[index % COLORS.length],
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

export default function VisualAnalytics({
  characters,
}: Props) {
  const totalCharacters = characters.length;

  const playableCount = characters.filter(
    (c) =>
      c.playable ||
      normalize(c.playable_status) === "playable"
  ).length;

  const transCount = characters.filter((c) => {
    const labels = [
      c.gender,
      c.sexuality,
      ...(c.identity_label || []),
    ].map(normalize);

    return labels.some((label) =>
      label.includes("trans")
    );
  }).length;

  const intersectionalCount = characters.filter(
    (c) =>
      normalize(c.intersectionality_present) !== "no" &&
      normalize(c.intersectionality_present) !== ""
  ).length;

  const sexualityMap: Record<string, number> = {};
  const genderMap: Record<string, number> = {};
  const identityCategoryMap: Record<string, number> = {};
  const intersectionalityMap: Record<string, number> = {};

  characters.forEach((character) => {
    // Sexuality
    if (
      character.sexuality &&
      normalize(character.sexuality) !== "none"
    ) {
      const key = normalize(character.sexuality);

      sexualityMap[key] =
        (sexualityMap[key] || 0) + 1;
    }

    // Gender
    if (
      character.gender &&
      normalize(character.gender) !== "none"
    ) {
      const key = normalize(character.gender);

      genderMap[key] =
        (genderMap[key] || 0) + 1;
    }

    // Identity categories
    (character.identity_category || []).forEach(
      (category) => {
        const key = normalize(category);

        identityCategoryMap[key] =
          (identityCategoryMap[key] || 0) + 1;
      }
    );

    // Intersectionality details
    if (
      character.intersectionality_details &&
      normalize(character.intersectionality_details) !==
        "none"
    ) {
      const details =
        character.intersectionality_details
          .split(";")
          .map((item) => item.trim())
          .filter(Boolean);

      details.forEach((detail) => {
        const key = normalize(detail);

        intersectionalityMap[key] =
          (intersectionalityMap[key] || 0) + 1;
      });
    }
  });

  // Year distribution
  const yearMap: Record<string, number> = {};

  characters.forEach((character) => {
    const year =
      character.release_year?.toString() ||
      "Unknown";

    yearMap[year] = (yearMap[year] || 0) + 1;
  });

  const yearData = Object.entries(yearMap)
    .map(([year, count]) => ({
      year,
      count,
    }))
    .sort((a, b) => Number(a.year) - Number(b.year));

  // Studio distribution
  const studioMap: Record<string, number> = {};

  characters.forEach((character) => {
    if (!character.developer) return;

    studioMap[character.developer] =
      (studioMap[character.developer] || 0) + 1;
  });

  const topStudios = Object.entries(studioMap)
    .map(([studio, count]) => ({
      studio,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-6">
      {/* OVERVIEW */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
          Dataset Overview
        </p>

        <h2 className="mt-3 text-5xl font-black text-white">
          {totalCharacters}
        </h2>

        <p className="mt-2 text-slate-400">
          Queer video game characters registered
        </p>
      </div>

      {/* DONUTS */}
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

      {/* BREAKDOWNS */}
      <BreakdownSection
        title="Sexuality Breakdown"
        data={sexualityMap}
      />

      <BreakdownSection
        title="Gender Breakdown"
        data={genderMap}
      />

      <BreakdownSection
        title="Identity Category Breakdown"
        data={identityCategoryMap}
      />

      <BreakdownSection
        title="Intersectionality Breakdown"
        data={intersectionalityMap}
      />

      {/* YEAR */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <h3 className="text-2xl font-black text-white">
          Representation by Year
        </h3>

        <div className="mt-8 h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearData}>
              <XAxis
                dataKey="year"
                stroke="#94a3b8"
              />

              <YAxis stroke="#94a3b8" />

              <Tooltip />

              <Bar
                dataKey="count"
                radius={[8, 8, 0, 0]}
                fill="#8b5cf6"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* STUDIOS */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <h3 className="text-2xl font-black text-white">
          Top Studios
        </h3>

        <div className="mt-8 space-y-5">
          {topStudios.map((studio, index) => {
            const percentage = Math.round(
              (studio.count / totalCharacters) * 100
            );

            return (
              <div key={studio.studio}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-200">
                    {studio.studio}
                  </span>

                  <span className="text-white">
                    {studio.count} · {percentage}%
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${percentage}%`,
                      background:
                        COLORS[index % COLORS.length],
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