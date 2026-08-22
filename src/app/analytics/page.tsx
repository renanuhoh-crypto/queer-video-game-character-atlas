"use client";

import { useEffect, useState } from "react";
import AnalyticsPageHero from "@/components/AnalyticsPageHero";
import VisualAnalytics from "@/components/VisualAnalytics";
import type {
  AnalyticsCharacter,
  AnalyticsReading,
  AnalyticsSystem,
} from "@/components/VisualAnalytics";

export default function AnalyticsPage() {
  const [characters, setCharacters] = useState<AnalyticsCharacter[]>([]);
  const [systems, setSystems] = useState<AnalyticsSystem[]>([]);
  const [readings, setReadings] = useState<AnalyticsReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const [charactersResponse, systemsResponse, readingsResponse] = await Promise.all([
          fetch("/api/characters"),
          fetch("/api/systems"),
          fetch("/api/queer-readings"),
        ]);
        const [charactersData, systemsData, readingsData] = await Promise.all([
          charactersResponse.json(),
          systemsResponse.json(),
          readingsResponse.json(),
        ]);
        setCharacters(charactersData.characters || []);
        setSystems(systemsData.systems || []);
        setReadings(readingsData.readings || []);
      } catch (error) {
        console.error("Failed loading analytics data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  return (
    <main className="pq-page min-h-screen bg-[#f7f7fb] text-[#12152b]">
      <AnalyticsPageHero
        characterCount={characters.length}
        systemCount={systems.length}
        readingCount={readings.length}
        loading={loading}
      />

      <section id="analytics-dashboard" className="relative scroll-mt-6 px-4 py-8 sm:px-6 md:px-10 md:py-10 lg:px-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(217,70,239,0.12),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(34,211,238,0.1),transparent_28%)]" />

        <div className="relative z-10 mx-auto w-full max-w-[1500px]">
          {loading ? (
            <div className="pq-panel p-5 text-[#646b89] sm:p-8">
              Loading Press Q dataset analytics...
            </div>
          ) : (
            <VisualAnalytics
              characters={characters}
              systems={systems}
              readings={readings}
            />
          )}
        </div>
      </section>
    </main>
  );
}
