"use client";

import { useEffect, useState } from "react";
import PrismPageHero from "@/components/PrismPageHero";
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
    <main className="pq-page min-h-screen bg-[#f7f7fb] text-[#12152b]">
      <PrismPageHero
        eyebrow="Data lens"
        title="Visual"
        accent="Analytics"
        description="Read the Press Q dataset through playable status, identity categories, intersectionality, release years, and studio patterns."
      />

      <section className="relative px-4 py-8 sm:px-6 md:px-10 md:py-10 lg:px-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(217,70,239,0.12),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(34,211,238,0.1),transparent_28%)]" />

        <div className="relative z-10 mx-auto w-full max-w-[1500px]">
          {loading ? (
            <div className="pq-panel p-5 text-[#646b89] sm:p-8">
              Loading Press Q dataset analytics...
            </div>
          ) : (
            <VisualAnalytics characters={characters} />
          )}
        </div>
      </section>
    </main>
  );
}
