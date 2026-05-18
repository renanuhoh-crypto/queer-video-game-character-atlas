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
  identity_category?: string | string[];
  identity_label?: string[];
  intersectionality_present?: string;
  intersectionality_details?: string;
}

interface Props {
  characters: Character[];
}

const COLORS = ["#d946ef", "#22d3ee", "#8b5cf6", "#ec4899", "#a78bfa"];

function normalize(value?: string | null) {
  return value?.trim().toLowerCase().replace(/\s+/g, "_") || "";
}

function formatLabel(value?: string | null) {
  if (!value) return "Unknown";

  const cleaned = value.replace(/_/g, " ").trim().toLowerCase();

  const aliases: Record<string, string> = {
    gay: "Gay",
    lesbian: "Lesbian",
    bisexual: "Bisexual",
    bi: "Bisexual",
    pansexual: "Pansexual",
    queer: "Queer",
    none: "None",
    female: "Female",
    male: "Male",
    trans_man: "Trans Man",
    "trans man": "Trans Man",
    trans_woman: "Trans Woman",
    "trans woman": "Trans Woman",
    "non-binary": "Non-Binary",
    non_binary: "Non-Binary",
    nonbinary: "Non-Binary",
    gender_identity: "Gender Identity",
    sexual_orientation: "Sexual Orientation",
    religion: "Religion",
    culture: "Culture",
    race: "Race",
    ethnicity: "Ethnicity",
    multiple: "Multiple",
  };

  return (
    aliases[cleaned] ||
    cleaned.replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function splitValues(value?: string | string[] | null) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return value
    .split(";")
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

function countBy(values: string[]) {
  const map: Record<string, number> = {};

  values.forEach((value) => {
    const clean = normalize(value);

    if (
      !clean ||
      clean === "none" ||
      clean === "no" ||
      clean === "not_registered"
    ) {
      return;
    }

    const label = formatLabel(clean);
    map[label] = (map[label] || 0) + 1;
  });

  return Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function BreakdownCard({
  title,
  data,
  total,
}: {
  title: string;
  data: { label: string; count: number }[];
  total: number;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <h3 className="mb-4 text-2xl font-black text-white">{title}</h3>

      {data.length === 0 ? (
        <p className="text-slate-400">No data registered yet.</p>
      ) : (
        <div className="mx-auto max-w-3xl space-y-4">
          {data.map((item) => {
            const percentage =
              total > 0 ? Math.round((item.count / total) * 100) : 0;

            return (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between gap-4 text-sm text-slate-300">
                  <span>{item.label}</span>
                  <span>
                    {item.count} · {percentage}%
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DonutCard({
  title,
  data,
  percentage,
  label,
  count,
  total,
  sentence,
}: {
  title: string;
  data: { name: string; value: number }[];
  percentage: number;
  label: string;
  count: number;
  total: number;
  sentence: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <h3 className="mb-4 text-2xl font-black text-white">{title}</h3>

      <div className="relative mx-auto h-44 min-h-[176px] max-w-[260px]">
        <ResponsiveContainer width="100%" height={176}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={4}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-3xl font-black text-white">{percentage}%</p>

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

export default function VisualAnalytics({ characters }: Props) {
  const totalCharacters = characters.length;

  const playableCount = characters.filter(
    (c) => c.playable || normalize(c.playable_status) === "playable"
  ).length;

  const transCount = characters.filter((c) => {
    const labels = [c.gender, c.sexuality, ...(c.identity_label || [])].map(
      normalize
    );

    return labels.some((label) => label.includes("trans"));
  }).length;

  const intersectionalityCount = characters.filter((character) => {
    const value = normalize(character.intersectionality_present);
    return value && value !== "none" && value !== "no";
  }).length;

  const playablePercentage =
    totalCharacters > 0
      ? Math.round((playableCount / totalCharacters) * 100)
      : 0;

  const transPercentage =
    totalCharacters > 0 ? Math.round((transCount / totalCharacters) * 100) : 0;

  const intersectionalityPercentage =
    totalCharacters > 0
      ? Math.round((intersectionalityCount / totalCharacters) * 100)
      : 0;

  const playableData = [
    { name: "Playable", value: playableCount },
    { name: "Non-playable", value: totalCharacters - playableCount },
  ];

  const transData = [
    { name: "Trans", value: transCount },
    { name: "Non-trans", value: totalCharacters - transCount },
  ];

  const intersectionalityData = [
    { name: "Intersectionality registered", value: intersectionalityCount },
    {
      name: "No intersectionality registered",
      value: totalCharacters - intersectionalityCount,
    },
  ];

  const sexualityBreakdown = countBy(
    characters.flatMap((character) => splitValues(character.sexuality))
  );

  const genderBreakdown = countBy(
    characters.flatMap((character) => splitValues(character.gender))
  );

  const identityCategoryBreakdown = countBy(
    characters.flatMap((character) => splitValues(character.identity_category))
  );

  const intersectionalityBreakdown = countBy(
    characters.flatMap((character) =>
      splitValues(character.intersectionality_present)
    )
  );

  const yearMap: Record<string, number> = {};

  characters.forEach((character) => {
    const year = character.release_year
      ? String(character.release_year)
      : "Unknown";

    yearMap[year] = (yearMap[year] || 0) + 1;
  });

  const yearData = Object.entries(yearMap).map(([year, count]) => ({
    year,
    count,
  }));

  const studioMap: Record<string, number> = {};

  characters.forEach((character) => {
    const studio = character.developer || "Unknown";
    studioMap[studio] = (studioMap[studio] || 0) + 1;
  });

  const topStudios = Object.entries(studioMap)
    .map(([studio, count]) => ({ studio, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-6">
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

      <div className="grid gap-6 xl:grid-cols-3">
        <DonutCard
          title="Playable Characters"
          data={playableData}
          percentage={playablePercentage}
          label="Playable"
          count={playableCount}
          total={totalCharacters}
          sentence="are playable"
        />

        <DonutCard
          title="Trans Representation"
          data={transData}
          percentage={transPercentage}
          label="Trans"
          count={transCount}
          total={totalCharacters}
          sentence="are trans"
        />

        <DonutCard
          title="Intersectionality"
          data={intersectionalityData}
          percentage={intersectionalityPercentage}
          label="Intersectionality"
          count={intersectionalityCount}
          total={totalCharacters}
          sentence="have intersectionality registered"
        />
      </div>

      <BreakdownCard
        title="Sexuality Breakdown"
        data={sexualityBreakdown}
        total={totalCharacters}
      />

      <BreakdownCard
        title="Gender Breakdown"
        data={genderBreakdown}
        total={totalCharacters}
      />

      <BreakdownCard
        title="Identity Category Breakdown"
        data={identityCategoryBreakdown}
        total={totalCharacters}
      />

      <BreakdownCard
        title="Intersectionality Breakdown"
        data={intersectionalityBreakdown}
        total={totalCharacters}
      />

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <h3 className="mb-4 text-2xl font-black text-white">
          Characters with Intersectionality Registered
        </h3>

        <p className="text-5xl font-black text-fuchsia-300">
          {intersectionalityCount}
        </p>

        <p className="mt-2 text-slate-400">
          out of {totalCharacters} registered characters
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <h3 className="mb-4 text-2xl font-black text-white">
          Representation by year
        </h3>

        <div className="mx-auto h-52 min-h-[208px] max-w-4xl">
          <ResponsiveContainer width="100%" height={208}>
            <BarChart data={yearData}>
              <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <BreakdownCard
        title="Studios with Most Queer Characters"
        data={topStudios.map((studio) => ({
          label: studio.studio,
          count: studio.count,
        }))}
        total={totalCharacters}
      />
    </div>
  );
}