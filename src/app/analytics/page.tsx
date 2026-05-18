"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import VisualAnalytics from "@/components/VisualAnalytics";

export default function AnalyticsPage() {
  const [characters, setCharacters] = useState([]);
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
    <main className="min-h-screen bg-[#05010f] text-white">
      <div className="mx-auto w-full max-w-[1400px] px-8 py-12">
        <Link
          href="/"
          className="mb-10 inline-block text-cyan-300 transition hover:text-cyan-200"
        >
          ← Back to Atlas
        </Link>

        <div className="mb-12">
          <h1 className="text-6xl font-black italic leading-none">
            <span className="text-white">Visual </span>
            <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-300 bg-clip-text text-transparent">
              Analytics
            </span>
          </h1>

          <p className="mt-4 max-w-4xl text-xl text-slate-300">
            Dataset overview, representation percentages, yearly distribution,
            and studio-level patterns.
          </p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-slate-300">
            Loading analytics...
          </div>
        ) : (
          <VisualAnalytics characters={characters} />
        )}
      </div>
    </main>
  );
}