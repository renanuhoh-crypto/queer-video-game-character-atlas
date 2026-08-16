"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import QuiuFlightGame from "@/components/QuiuFlightGame";

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
    <main className="min-h-screen overflow-hidden bg-[#f7f7fb] text-[#12152b]">
      <section className="space-landing relative isolate min-h-[860px] overflow-hidden text-white">
        <div className="space-landing-stars" aria-hidden="true" />
        <div className="space-comet space-comet--one" aria-hidden="true" />
        <div className="space-comet space-comet--two" aria-hidden="true" />

        <header className="relative z-40 px-4 pt-4 sm:px-7 sm:pt-6 lg:px-10">
          <div className="space-topbar mx-auto flex max-w-[1700px] items-center justify-between gap-4 px-4 py-3 sm:px-5">
            <Link href="/" aria-label="Press Q home" className="flex items-center gap-3 rounded-full pr-3 text-white">
              <Image
                src="/press-q-icon.png"
                alt=""
                width={624}
                height={667}
                priority
                className="h-11 w-auto sm:h-14"
              />
              <span className="text-sm font-black uppercase tracking-[0.18em] sm:text-base">
                Press Q
              </span>
            </Link>

            <nav className="hidden items-center gap-5 text-[11px] font-black uppercase tracking-[0.12em] text-white/78 md:flex xl:gap-8">
              <Link href="/about">About</Link>
              <Link href="/methodology">Methodology</Link>
              <Link href="/analytics">Analytics</Link>
              <Link href="/contribute">Contribute</Link>
              <Link href="/ethics">Ethics</Link>
            </nav>

            <Link href="/chat" className="space-nav-button px-4 py-2.5 text-[10px] sm:px-6 sm:py-3 sm:text-xs">
              Ask Quiu
            </Link>
          </div>
        </header>

        <div className="relative z-20 mx-auto grid max-w-[1600px] gap-10 px-5 pb-14 pt-10 sm:px-8 sm:pt-14 md:px-14 lg:min-h-[760px] lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-14 lg:px-20 lg:py-16">
          <div className="max-w-2xl">
            <h1 className="text-[clamp(3.4rem,7.4vw,7.5rem)] font-black leading-[0.85] tracking-[-0.055em] text-white">
              Press start on queer game history.
            </h1>
            <p className="mt-7 max-w-xl text-base font-bold leading-relaxed text-white/70 sm:text-lg md:text-xl">
              Explore characters, identities, evidence, and representation — or
              warm up with a quick flight through the archive.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/analytics" className="space-hero-button space-hero-button--primary w-full px-7 py-4 text-sm sm:w-auto">
                Explore the archive
              </Link>
              <Link href="/chat" className="space-hero-button space-hero-button--secondary w-full px-7 py-4 text-sm sm:w-auto">
                Ask Quiu
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-2 sm:gap-3">
              {heroStats.map((stat, index) => (
                <div key={stat.label} className="space-stat-card px-3 py-4 sm:px-5 sm:py-5">
                  <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/50 sm:text-[9px]">
                    0{index + 1} · {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-black text-white sm:text-4xl">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <QuiuFlightGame />
          </div>
        </div>

        <div className="relative z-20 border-t border-white/10 bg-[#151a4a]/35 px-5 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-white/50 backdrop-blur-md sm:px-8 md:px-14 lg:px-20">
          <div className="mx-auto flex max-w-[1600px] flex-wrap justify-between gap-2">
            <span>Queer games · evidence · context</span>
            <span>Press Q dataset / living index</span>
          </div>
        </div>
      </section>

      <section className="iridescent-content border-b border-black/10 px-5 py-12 text-[#17111d] sm:px-8 md:px-14 md:py-16 lg:px-20">
        <div className="mx-auto grid max-w-[1700px] gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.24em] text-[#4f5fe7] sm:text-xs sm:tracking-[0.4em]">
              Press Q dataset signal
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-black italic leading-tight sm:text-4xl md:text-6xl">
              Representation, measured without flattening the story.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {signalCards.map((card) => (
              <div
                key={card.label}
                className="holo-light-card p-5"
              >
                <p className="text-sm font-bold text-[#392d3f]/70">
                  {card.label}
                </p>
                <p className="iridescent-ink mt-4 text-4xl font-black">
                  {card.value}
                </p>
                <p className="mt-2 text-sm text-[#392d3f]/65">{card.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="iridescent-night px-5 py-12 sm:px-8 md:px-14 md:py-16 lg:px-20">
        <div className="mx-auto grid max-w-[1700px] gap-6 lg:grid-cols-3">
          <div className="holo-night-card p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#a7e1ee] sm:text-xs sm:tracking-[0.32em]">
              Top studios
            </p>
            <div className="mt-6 space-y-5">
              {analytics.studios.map((studio) => (
                <div key={studio.label}>
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2 text-sm text-slate-300">
                    <span className="min-w-0 break-words">{studio.label}</span>
                    <span>{studio.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden bg-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-[#5f70e9] to-[#8fd9ec]"
                      style={{
                        width: `${percent(studio.count, analytics.total)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="holo-night-card p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#b8c3ff] sm:text-xs sm:tracking-[0.32em]">
              Genre field
            </p>
            <div className="mt-6 space-y-5">
              {analytics.genres.map((genre) => (
                <div key={genre.label}>
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2 text-sm text-slate-300">
                    <span className="min-w-0 break-words">{genre.label}</span>
                    <span>{genre.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden bg-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-[#4f5fe7] to-[#b4a7ef]"
                      style={{
                        width: `${percent(genre.count, analytics.total)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="holo-night-card p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#b8c3ff] sm:text-xs sm:tracking-[0.32em]">
              Console
            </p>
            <h3 className="mt-5 text-2xl font-black italic sm:text-3xl">
              Ask the archive what the numbers mean.
            </h3>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              Use Quiu as a research console for exploring characters,
              identities, games, intersectionality, and representation
              patterns in the Press Q dataset.
            </p>
            <Link
              href="/chat"
              className="mt-8 inline-flex w-full justify-center rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:border-cyan-300/50 hover:text-cyan-300 sm:w-auto"
            >
              Open Chat
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
