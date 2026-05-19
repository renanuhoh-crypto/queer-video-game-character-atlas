"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PrismHeroScene from "@/components/PrismHeroScene";
import VisualAnalytics from "@/components/VisualAnalytics";

type Character = {
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
};

export default function AnalyticsPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCharacters() {
      try {
        const response = await fetch("/api/characters");
        const data = await response.json();
        setCharacters(data.characters || []);
      } catch (error) {
        console.error("Failed loading analytics data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCharacters();
  }, []);

  return (
    <main className="min-h-screen bg-[#020207] text-white">
      <section className="relative overflow-hidden border-b border-white/10 bg-black">
        <div className="absolute inset-0 opacity-75">
          <PrismHeroScene />
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.96)_0%,rgba(0,0,0,0.78)_42%,rgba(0,0,0,0.36)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(217,70,239,0.18),transparent_30%),radial-gradient(circle_at_70%_20%,rgba(34,211,238,0.13),transparent_28%)]" />

        <div className="relative z-10 mx-auto max-w-[1700px] px-5 pb-12 pt-8 sm:px-8 md:px-14 md:pb-16 md:pt-10 lg:px-20">
          <Link
            href="/"
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-300 transition hover:text-cyan-100 sm:text-xs sm:tracking-[0.32em]"
          >
            Back to PRSM
          </Link>

          <div className="mt-10 max-w-5xl sm:mt-14">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-fuchsia-300 sm:text-xs sm:tracking-[0.45em]">
              Data lens
            </p>

            <h1 className="mt-5 break-words text-5xl font-black italic leading-none tracking-normal sm:text-6xl md:text-8xl">
              Visual{" "}
              <span className="bg-gradient-to-r from-fuchsia-300 via-cyan-200 to-yellow-100 bg-clip-text text-transparent">
                Analytics
              </span>
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-200 sm:text-lg md:mt-6 md:text-2xl">
              Read PRSM through playable status, identity categories,
              intersectionality, release years, and studio patterns.
            </p>
          </div>
        </div>

        <div className="prism-bar relative z-10 h-3 overflow-hidden border-y border-white/10 bg-black">
          <div className="prism-bar__glow" />
          <div className="prism-bar__spectrum" />
          <div className="prism-bar__shine" />
          <div className="prism-bar__core" />
        </div>
      </section>

      <section className="relative px-4 py-8 sm:px-6 md:px-10 md:py-10 lg:px-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(217,70,239,0.12),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(34,211,238,0.1),transparent_28%)]" />

        <div className="relative z-10 mx-auto w-full max-w-[1500px]">
          {loading ? (
            <div className="border border-white/10 bg-white/[0.04] p-5 text-slate-300 backdrop-blur-xl sm:p-8">
              Loading analytics signal...
            </div>
          ) : (
            <VisualAnalytics characters={characters} />
          )}
        </div>
      </section>
    </main>
  );
}
