"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
        console.error("Failed loading characters:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCharacters();
  }, []);

  return (
    <main className="min-h-screen bg-[#05010f] px-8 py-10 text-white md:px-16">
      <Link href="/" className="text-sm text-cyan-300 hover:underline">
        ← Back to Atlas
      </Link>

      <h1 className="mt-8 text-5xl font-black italic md:text-7xl">
        Visual{" "}
        <span className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">
          Analytics
        </span>
      </h1>

      <p className="mt-4 max-w-3xl text-lg text-slate-300">
        Dataset overview, representation percentages, yearly distribution, and
        studio-level patterns.
      </p>

      <section className="mt-10 max-w-5xl">
        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-slate-300">
            Loading analytics...
          </div>
        ) : (
          <VisualAnalytics characters={characters} />
        )}
      </section>
    </main>
  );
}
