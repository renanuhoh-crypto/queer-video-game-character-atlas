"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Character = {
  character_id?: string;
  character_name?: string;
  game_title?: string;
  release_year?: number | null;
};

type YearStop = {
  year: number;
  count: number;
  cumulative: number;
  characters: Character[];
};

export default function RainbowRoadTimeline() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/characters")
      .then((response) => response.json())
      .then((data) => setCharacters(data.characters || []))
      .catch(() => setCharacters([]))
      .finally(() => setLoading(false));
  }, []);

  const stops = useMemo<YearStop[]>(() => {
    const groups = new Map<number, Character[]>();
    characters.forEach((character) => {
      if (typeof character.release_year !== "number") return;
      const group = groups.get(character.release_year) || [];
      group.push(character);
      groups.set(character.release_year, group);
    });
    return [...groups.entries()]
      .sort(([a], [b]) => a - b)
      .reduce<YearStop[]>((timeline, [year, records]) => {
        const cumulative = (timeline.at(-1)?.cumulative || 0) + records.length;
        return [...timeline, { year, count: records.length, cumulative, characters: records }];
      }, []);
  }, [characters]);

  const activeIndex = active ?? Math.max(stops.length - 1, 0);
  const current = stops[activeIndex];
  const progress = stops.length > 1 ? activeIndex / (stops.length - 1) : 0;

  function move(direction: number) {
    setActive(Math.max(0, Math.min(stops.length - 1, activeIndex + direction)));
  }

  return (
    <main className="rainbow-road-page">
      <nav className="rainbow-road-nav">
        <Link href="/" className="rainbow-road-brand">Press Q</Link>
        <div className="flex items-center gap-4 text-xs font-black uppercase tracking-[.13em]">
          <Link href="/analytics" className="transition hover:text-[#83e9f5]">Analytics</Link>
          <span aria-current="page" className="text-[#ff7ca4]">Rainbow Road</span>
        </div>
      </nav>

      <header className="rainbow-road-intro">
        <p className="rainbow-road-kicker">Press Q presents</p>
        <h1>Rainbow<br /><span>Road</span></h1>
        <p className="rainbow-road-lede">
          Travel with Quiu through the release years represented in the archive.
          Every stop shows characters first appearing in games released that year.
        </p>
      </header>

      <section className="rainbow-road-stage" aria-label="Interactive queer character timeline">
        <div className="rainbow-road-sky rainbow-road-sky--far" style={{ transform: `translateX(${-progress * 10}%)` }} />
        <div className="rainbow-road-sky rainbow-road-sky--near" style={{ transform: `translateX(${-progress * 22}%)` }} />
        <div className="rainbow-road-stars" aria-hidden="true" />

        {loading ? (
          <p className="rainbow-road-loading">Loading the archive road…</p>
        ) : current ? (
          <>
            <div className="rainbow-road-hud" aria-live="polite">
              <p className="rainbow-road-hud-label">Release year</p>
              <p className="rainbow-road-year">{current.year}</p>
              <div className="rainbow-road-totals">
                <span><strong>{current.count}</strong> this year</span>
                <span><strong>{current.cumulative}</strong> documented up to here</span>
              </div>
            </div>

            <div className="rainbow-road-track-wrap">
              <div className="rainbow-road-track">
                <div className="rainbow-road-track-fill" style={{ width: `${progress * 100}%` }} />
                {stops.map((stop, index) => (
                  <button
                    key={stop.year}
                    type="button"
                    className={`rainbow-road-stop ${index === activeIndex ? "is-active" : ""}`}
                    style={{ left: `${(index / Math.max(stops.length - 1, 1)) * 100}%` }}
                    onClick={() => setActive(index)}
                    aria-label={`${stop.year}: ${stop.count} characters`}
                  >
                    <span>{stop.year}</span>
                  </button>
                ))}
                <div className="rainbow-road-quiu" style={{ left: `${progress * 100}%` }} aria-hidden="true">
                  <span className="rainbow-road-quiu-glow" />
                  <Image src="/quiu-thinking.png" alt="" width={180} height={180} priority />
                </div>
              </div>
            </div>

            <div className="rainbow-road-controls">
              <button type="button" onClick={() => move(-1)} disabled={activeIndex === 0} aria-label="Previous year">←</button>
              <input
                aria-label="Choose a release year"
                type="range"
                min="0"
                max={Math.max(stops.length - 1, 0)}
                value={activeIndex}
                onChange={(event) => setActive(Number(event.target.value))}
              />
              <button type="button" onClick={() => move(1)} disabled={activeIndex === stops.length - 1} aria-label="Next year">→</button>
            </div>

            <article className="rainbow-road-card">
              <p className="rainbow-road-card-label">Archive checkpoint · {current.year}</p>
              <h2>{current.count === 1 ? "1 character enters the road" : `${current.count} characters enter the road`}</h2>
              <ul>
                {current.characters.map((character, index) => (
                  <li key={character.character_id || `${character.character_name}-${index}`}>
                    <strong>{character.character_name || "Unnamed character"}</strong>
                    <span>{character.game_title || "Game not recorded"}</span>
                  </li>
                ))}
              </ul>
            </article>
          </>
        ) : (
          <p className="rainbow-road-loading">No release years are documented yet.</p>
        )}
      </section>

      <aside className="rainbow-road-note">
        <strong>How to read this road:</strong> these are Press Q records grouped by the release year of each character&apos;s game. The cumulative count describes the current archive, not every queer character ever created.
      </aside>
    </main>
  );
}
