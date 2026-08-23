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

type CatalogGame = {
  game_id: string;
  game_title: string;
  release_year: number | null;
  archive_url: string;
  archive_status: "researched" | "needs_research";
};

type YearStop = {
  year: number;
  gameCount: number;
  characterCount: number;
  cumulativeGames: number;
  cumulativeCharacters: number;
  games: CatalogGame[];
  characters: Character[];
};

export default function RainbowRoadTimeline() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [games, setGames] = useState<CatalogGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/characters").then((response) => response.json()),
      fetch("/api/games").then((response) => response.json()),
    ])
      .then(([characterData, gameData]) => {
        setCharacters(characterData.characters || []);
        setGames(gameData.games || []);
      })
      .catch(() => {
        setCharacters([]);
        setGames([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const stops = useMemo<YearStop[]>(() => {
    const characterGroups = new Map<number, Character[]>();
    characters.forEach((character) => {
      if (typeof character.release_year !== "number") return;
      const group = characterGroups.get(character.release_year) || [];
      group.push(character);
      characterGroups.set(character.release_year, group);
    });

    const gameGroups = new Map<number, CatalogGame[]>();
    games.forEach((game) => {
      if (typeof game.release_year !== "number") return;
      const group = gameGroups.get(game.release_year) || [];
      group.push(game);
      gameGroups.set(game.release_year, group);
    });

    const years = [...new Set([...characterGroups.keys(), ...gameGroups.keys()])].sort((a, b) => a - b);
    return years.reduce<YearStop[]>((timeline, year) => {
        const yearGames = gameGroups.get(year) || [];
        const yearCharacters = characterGroups.get(year) || [];
        const previous = timeline.at(-1);
        return [...timeline, {
          year,
          gameCount: yearGames.length,
          characterCount: yearCharacters.length,
          cumulativeGames: (previous?.cumulativeGames || 0) + yearGames.length,
          cumulativeCharacters: (previous?.cumulativeCharacters || 0) + yearCharacters.length,
          games: yearGames,
          characters: yearCharacters,
        }];
      }, []);
  }, [characters, games]);

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
          Every stop compares games catalogued by the source with individually verified character records.
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
                <span><strong>{current.gameCount}</strong> games this year</span>
                <span><strong>{current.characterCount}</strong> verified characters</span>
                <span><strong>{current.cumulativeGames}</strong> cumulative games</span>
                <span><strong>{current.cumulativeCharacters}</strong> cumulative characters</span>
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
                    aria-label={`${stop.year}: ${stop.gameCount} games and ${stop.characterCount} verified characters`}
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
              <h2>{current.gameCount === 1 ? "1 game enters the road" : `${current.gameCount} games enter the road`}</h2>
              <h3>Verified character records</h3>
              {current.characters.length > 0 ? <ul>
                {current.characters.map((character, index) => (
                  <li key={character.character_id || `${character.character_name}-${index}`}>
                    <strong>{character.character_name || "Unnamed character"}</strong>
                    <span>{character.game_title || "Game not recorded"}</span>
                  </li>
                ))}
              </ul> : <p className="rainbow-road-empty">No individually verified characters are registered for this year yet.</p>}

              <h3>Games catalogued by LGBTQ Video Game Archive</h3>
              <ul className="rainbow-road-game-list">
                {current.games.slice(0, 24).map((game) => (
                  <li key={game.game_id}>
                    {game.archive_url ? (
                      <a href={game.archive_url} target="_blank" rel="noreferrer">{game.game_title}</a>
                    ) : <strong>{game.game_title}</strong>}
                    <span>{game.archive_status === "researched" ? "Archive page available" : "Research still needed"}</span>
                  </li>
                ))}
              </ul>
              {current.games.length > 24 ? (
                <p className="rainbow-road-more">+ {current.games.length - 24} additional games in this year</p>
              ) : null}
            </article>
          </>
        ) : (
          <p className="rainbow-road-loading">No release years are documented yet.</p>
        )}
      </section>

      <aside className="rainbow-road-note">
        <strong>How to read this road:</strong> the game count comes from the LGBTQ Video Game Archive source list after duplicate titles are consolidated. Character totals only include individually researched Press Q records. A game&apos;s presence never automatically turns every character in it into a confirmed queer character.
      </aside>
    </main>
  );
}
