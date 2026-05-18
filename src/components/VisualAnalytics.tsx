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
    const labels = [
      c.gender,
      c.sexuality,
      ...(c.identity_label || []),
    ].map(normalize);

    return labels.some((label) => label.includes("trans"));
  }).length;

  const playableData = [
    {
      name: "Playable",
      value: playableCount,
    },
    {
      name: "Non-playable",
      value: totalCharacters - playableCount,
    },
  ];

  const transData = [
    {
      name: "Trans",
      value: transCount,
    },
    {
      name: "Non-trans",
      value: totalCharacters - transCount,
    },
  ];

  // Representation by year
  const yearMap: Record<string, number> = {};

  characters.forEach((character) => {
    const year = character.release_year || "Unknown";

    if (!yearMap[year]) {
      yearMap[year] = 0;
    }

    yearMap[year]++;
  });

  const yearData = Object.entries(yearMap).map(([year, count]) => ({
    year,
    count,
  }));

  // Studios
  const studioMap: Record<string, number> = {};

  characters.forEach((character) => {