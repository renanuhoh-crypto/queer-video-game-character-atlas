"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PrismHeroScene from "@/components/PrismHeroScene";

type Character = {
  character_name: string;
  game_title: string;
  release_year?: number | null;
  developer?: string;
  genre?: string;
  playable?: boolean;
  playable_status?: string;
  gender?: string;
  sexuality?: string;
  identity_category?: string[];
  identity_confirmation?: string;
  queer_status?: string;
  intersectionality_present?: string;
};

function normalize(value?: string | null) {
  return value?.trim().toLowerCase().replace(/\s+/g, "_") || "";
}

function formatLabel(value?: string | null) {
  if (!value) return "Unknown";

  return value
    .replace(/_/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function percent(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

function countBy(values: string[]) {
  const map: Record<string, number> = {};

  values.forEach((value) => {
    const clean = value?.trim();
    if (!clean || normalize(clean) === "none") return;

    const label = formatLabel(clean);
    map[label] = (map[label] || 0) + 1;
  });

  return Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export default function Home() {
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    async function loadCharacters() {
      try {
        const response = await fetch("/api/characters");
        const data = await response.json();
        setCharacters(data.characters || []);
      } catch (error) {
        console.error("Failed loading characters:", error);
      }
    }

    loadCharacters();
  }, []);

  const analytics = useMemo(() => {
    const total = characters.length;

    const playable = characters.filter(
      (character) =>
        character.playable ||
        normalize(character.playable_status) === "playable"
    ).length;

    const trans = characters.filter((character) => {
      const values = [
        character.gender,
        character.sexuality,
        ...(character.identity_category || []),
      ].map(normalize);

      return values.some((value) => value.includes("trans"));
    }).length;

    const confirmed = characters.filter(
      (character) => normalize(character.queer_status) === "confirmed"
    ).length;

    const explicit = characters.filter(
      (character) =>
        normalize(character.identity_confirmation) === "explicit_in_game"
    ).length;

    const intersectional = characters.filter((character) => {
      const value = normalize(character.intersectionality_present);
      return value.length > 0 && value !== "none" && value !== "no";
    }).length;

    const studios = countBy(
      characters.map((character) => character.developer || "Unknown")
    ).slice(0, 4);

    const genres = countBy(
      characters.flatMap((character) =>
        (character.genre || "Unknown").split(";").map((item) => item.trim())
      )
    ).slice(0, 4);

    const years = characters
      .map((character) => character.release_year)
      .filter((year): year is number => typeof year === "number")
      .sort((a, b) => a - b);

    return {
      total,
      playable,
      playablePercent: percent(playable, total),
      trans,
      transPercent: percent(trans, total),
      confirmed,
      confirmedPercent: percent(confirmed, total),
      explicit,
      explicitPercent: percent(explicit, total),
      intersectional,
      intersectionalPercent: percent(intersectional, total),
      studios,
      genres,
      firstYear: years[0] || null,
      latestYear: years.at(-1) || null,
    };
  }, [characters]);

  const heroStats = [
    {
      label: "Characters",
      value: analytics.total,
      detail: "structured entries",
    },
    {
      label: "Playable",
      value: `${analytics.playablePercent}%`,
      detail: `${analytics.playable} playable characters`,
    },
    {
      label: "Trans",
      value: `${analytics.transPercent}%`,
      detail: `${analytics.trans} entries with trans representation`,
    },
  ];

  const signalCards = [
    {
      label: "Explicit in-game",
      value: `${analytics.explicitPercent}%`,
      detail: `${analytics.explicit} entries with in-game confirmation`,
    },
    {
      label: "Confirmed queer status",
      value: `${analytics.confirmedPercent}%`,
      detail: `${analytics.confirmed} confirmed entries`,
    },
    {
      label: "Intersectionality",
      value: `${analytics.intersectionalPercent}%`,
      detail: `${analytics.intersectional} entries with added context`,
    },
    {
      label: "Timeline",
      value:
        analytics.firstYear && analytics.latestYear
          ? `${analytics.firstYear}-${analytics.latestYear}`
          : "Loading",
      detail: "release years represented",
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#020207] text-white">
      <section className="relative min-h-[88vh] overflow-hidden border-b border-white/10 bg-black">
        <PrismHeroScene />

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.94)_0%,rgba(0,0,0,0.68)_34%,rgba(0,0,0,0.18)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(217,70,239,0.18),transparent_28%),radial-gradient(circle_at_72%_28%,rgba(34,211,238,0.16),transparent_28%)]" />

        <header className="relative z-10 border-b border-white/10">
          <div className="mx-auto flex max-w-[1700px] items-center justify-between px-8 py-6 md:px-14 lg:px-20">
            <Link
              href="/"
              className="text-sm font-black tracking-[0.42em] text-white"
            >
              PRSM
            </Link>

            <nav className="hidden items-center gap-8 text-sm font-bold text-slate-300 md:flex">
              <Link href="/about" className="transition hover:text-cyan-300">
                About
              </Link>
              <Link
                href="/methodology"
                className="transition hover:text-cyan-300"
              >
                Methodology
              </Link>
              <Link
                href="/analytics"
                className="transition hover:text-cyan-300"
              >
                Analytics
              </Link>
              <Link href="/chat" className="transition hover:text-cyan-300">
                Chat
              </Link>
              <Link href="/ethics" className="transition hover:text-cyan-300">
                Ethics
              </Link>
            </nav>

            <Link
              href="/analytics"
              className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-xs font-black text-white backdrop-blur-xl transition hover:border-cyan-300/50 hover:text-cyan-300"
            >
              Explore Data
            </Link>
          </div>
        </header>

        <div className="prism-bar relative z-10 h-3 overflow-hidden border-y border-white/10 bg-black">
          <div className="prism-bar__glow" />
          <div className="prism-bar__spectrum" />
          <div className="prism-bar__shine" />
          <div className="prism-bar__core" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-[1700px] gap-12 px-8 py-16 md:px-14 lg:grid-cols-[1fr_480px] lg:px-20 lg:py-20">
          <div className="max-w-4xl">
            <p className="font-mono text-xs uppercase tracking-[0.45em] text-cyan-300">
              AI-assisted queer game archive
            </p>

            <h1 className="mt-6 text-7xl font-black italic leading-none tracking-normal text-white md:text-9xl">
              PRSM
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-relaxed text-slate-200 md:text-2xl">
              A prism-cut archive for reading queer video game representation
              through characters, identity fields, studios, and narrative
              context.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/analytics"
                className="rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 px-6 py-4 text-sm font-black text-white shadow-[0_0_32px_rgba(34,211,238,0.28)] transition hover:scale-105"
              >
                View Analytics
              </Link>

              <Link
                href="/chat"
                className="rounded-full border border-white/15 bg-white/10 px-6 py-4 text-sm font-black text-white backdrop-blur-xl transition hover:border-fuchsia-300/50 hover:text-fuchsia-300"
              >
                Ask PRSM
              </Link>
            </div>
          </div>

          <div className="grid content-end gap-4">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="border border-white/10 bg-black/35 p-5 backdrop-blur-xl"
              >
                <p className="font-mono text-xs uppercase tracking-[0.32em] text-slate-400">
                  {stat.label}
                </p>
                <p className="mt-3 text-5xl font-black text-white">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-slate-300">{stat.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#05010f] px-8 py-16 md:px-14 lg:px-20">
        <div className="mx-auto grid max-w-[1700px] gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.4em] text-fuchsia-300">
              Dataset signal
            </p>
            <h2 className="mt-4 max-w-2xl text-4xl font-black italic leading-tight md:text-6xl">
              Representation, measured without flattening the story.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {signalCards.map((card) => (
              <div
                key={card.label}
                className="border border-white/10 bg-white/[0.04] p-5"
              >
                <p className="text-sm font-bold text-slate-300">
                  {card.label}
                </p>
                <p className="mt-4 text-4xl font-black text-cyan-300">
                  {card.value}
                </p>
                <p className="mt-2 text-sm text-slate-400">{card.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#03030a] px-8 py-16 md:px-14 lg:px-20">
        <div className="mx-auto grid max-w-[1700px] gap-6 lg:grid-cols-3">
          <div className="border border-white/10 bg-white/[0.04] p-6">
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-cyan-300">
              Top studios
            </p>
            <div className="mt-6 space-y-5">
              {analytics.studios.map((studio) => (
                <div key={studio.label}>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                    <span>{studio.label}</span>
                    <span>{studio.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden bg-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-300"
                      style={{
                        width: `${percent(studio.count, analytics.total)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-white/10 bg-white/[0.04] p-6">
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-fuchsia-300">
              Genre field
            </p>
            <div className="mt-6 space-y-5">
              {analytics.genres.map((genre) => (
                <div key={genre.label}>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                    <span>{genre.label}</span>
                    <span>{genre.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden bg-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-yellow-200"
                      style={{
                        width: `${percent(genre.count, analytics.total)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-white/10 bg-gradient-to-br from-white/[0.08] to-cyan-300/[0.06] p-6">
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-yellow-200">
              Console
            </p>
            <h3 className="mt-5 text-3xl font-black italic">
              Ask the archive what the numbers mean.
            </h3>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              Use PRSM as a research console for characters, identities,
              games, intersectionality, and representation patterns.
            </p>
            <Link
              href="/chat"
              className="mt-8 inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:border-cyan-300/50 hover:text-cyan-300"
            >
              Open Chat
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
