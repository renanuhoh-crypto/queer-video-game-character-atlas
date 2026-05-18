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
}

interface Props {
  characters: Character[];
}

const COLORS = ["#d946ef", "#22d3ee", "#8b5cf6", "#ec4899"];

function normalize(value?: string | null) {
  return value?.trim().toLowerCase().replace(/\s+/g, "_") || "";
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

  const playablePercentage =
    totalCharacters > 0
      ? Math.round((playableCount / totalCharacters) * 100)
      : 0;

  const transPercentage =
    totalCharacters > 0 ? Math.round((transCount / totalCharacters) * 100) : 0;

  const playableData = [
    { name: "Playable", value: playableCount },
    { name: "Non-playable", value: totalCharacters - playableCount },
  ];

  const transData = [
    { name: "Trans", value: transCount },
    { name: "Non-trans", value: totalCharacters - transCount },
  ];

  const yearMap: Record<string, number> = {};

  characters.forEach((character) => {
    const year = character.release_year ? String(character.release_year) : "Unknown";
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
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
          Dataset Overview
        </p>

        <h2 className="mt-3 text-5xl font-black text-white">
          {totalCharacters}
        </h2>

        <p className="mt-2 text-slate-400">
          queer video game characters registered
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <h3 className="mb-4 text-2xl font-black text-white">
          Playable Characters
        </h3>

        <div className="relative h-44 min-h-[176px] w-full min-w-0">
          <ResponsiveContainer width="100%" height={176}>
            <PieChart>
              <Pie
                data={playableData}
                dataKey="value"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={4}
              >
                {playableData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-black text-white">
                {playablePercentage}%
              </p>
              <p className="text-xs uppercase tracking-widest text-slate-400">
                playable
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <h3 className="mb-4 text-2xl font-black text-white">
          Trans Representation
        </h3>

        <div className="relative h-44 min-h-[176px] w-full min-w-0">
          <ResponsiveContainer width="100%" height={176}>
            <PieChart>
              <Pie
                data={transData}
                dataKey="value"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={4}
              >
                {transData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-black text-white">
                {transPercentage}%
              </p>
              <p className="text-xs uppercase tracking-widest text-slate-400">
                trans
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <h3 className="mb-4 text-2xl font-black text-white">
          Representation by year
        </h3>

        <div className="h-52 min-h-[208px] w-full min-w-0">
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

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <h3 className="mb-4 text-2xl font-black text-white">
          Studios with most queer characters
        </h3>

        <div className="space-y-4">
          {topStudios.map((studio) => (
            <div key={studio.studio}>
              <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
                <span>{studio.studio}</span>
                <span>{studio.count}</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400"
                  style={{
                    width: `${
                      totalCharacters > 0
                        ? (studio.count / totalCharacters) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}