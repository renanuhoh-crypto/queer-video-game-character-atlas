/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";

type GalleryCharacter = {
  character_id: string;
  character_name: string;
  game_title: string;
  release_year?: number | null;
  developer?: string;
  publisher?: string;
  genre?: string;
  narrative_role?: string;
  playable_status?: string;
  content_availability?: string[];
  gender?: string;
  sexuality?: string;
  identity_confirmation?: string;
  queer_status?: string;
  intersectionality_details?: string;
  evidence_source?: string;
  notes?: string;
  character_image?: string;
  image_credit?: string;
  image_source_url?: string;
  research_status?: string;
  evidence_confidence?: string;
  platform_version?: string;
};

const PAGE_SIZE = 24;

function splitValues(value?: string | string[]) {
  if (!value) return [];
  const values = Array.isArray(value) ? value : [value];
  return values
    .flatMap((item) => item.split(/[;,]/))
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalize(value?: string | null) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function formatLabel(value?: string | null) {
  if (!value) return "Not recorded";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function safeUrl(value?: string) {
  return value && /^https?:\/\//i.test(value) ? value : null;
}

function CharacterPortrait({ character }: { character: GalleryCharacter }) {
  const [failed, setFailed] = useState(false);
  const image = character.character_image?.trim();

  if (!image || failed) {
    const initials = character.character_name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

    return (
      <div className="relative grid h-full w-full place-items-center overflow-hidden bg-[#151a4a]">
        <div className="absolute -left-10 top-4 h-32 w-32 rounded-full bg-fuchsia-400/30 blur-3xl" />
        <div className="absolute -right-8 bottom-4 h-36 w-36 rounded-full bg-cyan-300/25 blur-3xl" />
        <span className="relative text-5xl font-black italic text-white/90">
          {initials || "Q"}
        </span>
        <span className="absolute bottom-4 font-mono text-[9px] font-black uppercase tracking-[.22em] text-white/45">
          Image pending
        </span>
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={character.character_name}
      className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.035]"
      onError={() => setFailed(true)}
    />
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="font-mono text-[9px] font-black uppercase tracking-[.18em] text-[#727b9d]">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold leading-6 text-[#242945]">
        {value}
      </dd>
    </div>
  );
}

export default function CharacterGallery() {
  const [characters, setCharacters] = useState<GalleryCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [identity, setIdentity] = useState("all");
  const [onlyImages, setOnlyImages] = useState(false);
  const [sort, setSort] = useState("name");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<GalleryCharacter | null>(null);

  useEffect(() => {
    async function loadCharacters() {
      try {
        const response = await fetch("/api/characters");
        if (!response.ok) throw new Error("Could not load the gallery.");
        const data = (await response.json()) as {
          characters?: GalleryCharacter[];
        };
        setCharacters(data.characters || []);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load the gallery.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadCharacters();
  }, []);

  useEffect(() => {
    if (!selected) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selected]);

  const identities = useMemo(
    () =>
      Array.from(
        new Set(
          characters.flatMap((character) => [
            ...splitValues(character.gender),
            ...splitValues(character.sexuality),
          ]),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [characters],
  );

  const filtered = useMemo(() => {
    const query = normalize(search);
    const result = characters.filter((character) => {
      const haystack = normalize(
        [
          character.character_name,
          character.game_title,
          character.developer,
          character.publisher,
          character.genre,
        ].join(" "),
      );
      const identityValues = [
        ...splitValues(character.gender),
        ...splitValues(character.sexuality),
      ].map(normalize);

      return (
        (!query || haystack.includes(query)) &&
        (status === "all" || normalize(character.queer_status) === status) &&
        (identity === "all" || identityValues.includes(normalize(identity))) &&
        (!onlyImages || Boolean(character.character_image?.trim()))
      );
    });

    return result.sort((left, right) => {
      if (sort === "oldest") {
        return (left.release_year || 9999) - (right.release_year || 9999);
      }
      if (sort === "newest") {
        return (right.release_year || 0) - (left.release_year || 0);
      }
      if (sort === "game") {
        return left.game_title.localeCompare(right.game_title);
      }
      return left.character_name.localeCompare(right.character_name);
    });
  }, [characters, identity, onlyImages, search, sort, status]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <section className="pq-gallery relative px-4 py-9 sm:px-6 md:px-10 md:py-12 lg:px-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(217,70,239,0.11),transparent_26%),radial-gradient(circle_at_88%_12%,rgba(34,211,238,0.1),transparent_28%)]" />
      <div className="relative z-10 mx-auto max-w-[1500px]">
        <div className="pq-gallery-toolbar rounded-2xl border border-[#dfe3f3] bg-white/90 p-4 shadow-[0_14px_45px_rgba(49,54,101,.08)] backdrop-blur sm:p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.4fr)_repeat(3,minmax(150px,.6fr))_auto]">
            <label className="grid gap-1.5">
              <span className="font-mono text-[9px] font-black uppercase tracking-[.18em] text-[#596383]">
                Search the gallery
              </span>
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                placeholder="Character, game, studio, genre…"
                className="min-h-11 rounded-xl border border-[#d3d8ed] bg-white px-3.5 text-sm outline-none transition focus:border-[#4f5fe7] focus:ring-4 focus:ring-[#4f5fe7]/10"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="font-mono text-[9px] font-black uppercase tracking-[.18em] text-[#596383]">
                Queer status
              </span>
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                className="min-h-11 rounded-xl border border-[#d3d8ed] bg-white px-3 text-sm outline-none focus:border-[#4f5fe7]"
              >
                <option value="all">All statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="ambiguous">Ambiguous</option>
                <option value="not confirmed">Not confirmed</option>
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="font-mono text-[9px] font-black uppercase tracking-[.18em] text-[#596383]">
                Identity
              </span>
              <select
                value={identity}
                onChange={(event) => {
                  setIdentity(event.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                className="min-h-11 rounded-xl border border-[#d3d8ed] bg-white px-3 text-sm outline-none focus:border-[#4f5fe7]"
              >
                <option value="all">All identities</option>
                {identities.map((item) => (
                  <option key={item} value={item}>
                    {formatLabel(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="font-mono text-[9px] font-black uppercase tracking-[.18em] text-[#596383]">
                Sort
              </span>
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                className="min-h-11 rounded-xl border border-[#d3d8ed] bg-white px-3 text-sm outline-none focus:border-[#4f5fe7]"
              >
                <option value="name">Character name</option>
                <option value="game">Game title</option>
                <option value="oldest">Oldest first</option>
                <option value="newest">Newest first</option>
              </select>
            </label>
            <label className="flex min-h-11 items-center gap-2 self-end rounded-xl border border-[#d3d8ed] bg-white px-3 text-xs font-bold text-[#49516f]">
              <input
                type="checkbox"
                checked={onlyImages}
                onChange={(event) => {
                  setOnlyImages(event.target.checked);
                  setVisibleCount(PAGE_SIZE);
                }}
                className="h-4 w-4 accent-[#4f5fe7]"
              />
              With image
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[.2em] text-[#4f5fe7]">
              Current archive
            </p>
            <h2 className="mt-1 text-2xl font-black italic text-[#171b3e]">
              {filtered.length} {filtered.length === 1 ? "character record" : "character records"}
            </h2>
          </div>
          <p className="max-w-xl text-xs leading-5 text-[#6b728f]">
            One card represents one character in one game. Missing images are
            shown as research gaps and do not hide the record.
          </p>
        </div>

        {loading ? (
          <div className="pq-gallery-state mt-6 rounded-2xl border border-[#dfe3f3] bg-white p-8 text-sm font-semibold text-[#6b728f]">
            Loading character gallery…
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-8 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : visible.length ? (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {visible.map((character) => {
                const tags = [
                  ...splitValues(character.gender),
                  ...splitValues(character.sexuality),
                ].slice(0, 3);

                return (
                  <button
                    key={`${character.character_id}-${character.game_title}`}
                    type="button"
                    onClick={() => setSelected(character)}
                    className="pq-gallery-card group overflow-hidden rounded-2xl border border-[#dfe3f3] bg-white text-left shadow-[0_10px_32px_rgba(49,54,101,.08)] transition hover:-translate-y-1 hover:border-[#8291ff]/60 hover:shadow-[0_18px_40px_rgba(79,95,231,.16)] focus:outline-none focus:ring-4 focus:ring-[#4f5fe7]/20"
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <CharacterPortrait character={character} />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-black leading-tight text-[#171b3e]">
                          {character.character_name}
                        </h3>
                        {character.release_year ? (
                          <span className="font-mono text-[10px] font-black text-[#727b9d]">
                            {character.release_year}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-[#596383]">
                        {character.game_title}
                      </p>
                      <div className="mt-3 flex min-h-6 flex-wrap gap-1.5">
                        {tags.length ? (
                          tags.map((tag) => (
                            <span
                              key={tag}
                              className="pq-gallery-tag rounded-full bg-[#eef0ff] px-2 py-1 text-[9px] font-black uppercase tracking-[.08em] text-[#4f5fe7]"
                            >
                              {formatLabel(tag)}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] font-semibold text-[#9aa1b9]">
                            Identity details pending
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {visibleCount < filtered.length ? (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  className="pq-primary-button px-7 py-3 text-xs"
                >
                  Show more characters
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="pq-gallery-state mt-6 rounded-2xl border border-dashed border-[#cbd1e8] bg-white/70 p-10 text-center">
            <p className="text-lg font-black text-[#242945]">No matching records</p>
            <p className="mt-2 text-sm text-[#6b728f]">
              Try removing one of the filters or searching for another term.
            </p>
          </div>
        )}
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-[#080b24]/75 p-3 backdrop-blur-sm sm:p-6"
          role="presentation"
          onClick={() => setSelected(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="gallery-character-title"
            className="pq-gallery-modal max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-[0_28px_90px_rgba(4,7,28,.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid md:grid-cols-[minmax(260px,.72fr)_minmax(0,1fr)]">
              <div className="min-h-[280px] overflow-hidden bg-[#151a4a] md:min-h-[560px]">
                <CharacterPortrait character={selected} />
              </div>
              <div className="relative p-5 sm:p-7">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Close character record"
                  className="pq-gallery-close absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-[#dfe3f3] bg-white text-lg font-black text-[#424a68] transition hover:bg-[#eef0ff]"
                >
                  ×
                </button>
                <p className="font-mono text-[9px] font-black uppercase tracking-[.2em] text-[#4f5fe7]">
                  Character record · {selected.character_id}
                </p>
                <h2
                  id="gallery-character-title"
                  className="mt-3 pr-10 text-3xl font-black italic leading-none text-[#171b3e] sm:text-4xl"
                >
                  {selected.character_name}
                </h2>
                <p className="mt-3 text-base font-bold text-[#596383]">
                  {selected.game_title}
                  {selected.release_year ? ` · ${selected.release_year}` : ""}
                </p>

                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  <DetailRow label="Gender" value={splitValues(selected.gender).map(formatLabel).join(", ")} />
                  <DetailRow label="Sexuality" value={splitValues(selected.sexuality).map(formatLabel).join(", ")} />
                  <DetailRow label="Narrative role" value={formatLabel(selected.narrative_role)} />
                  <DetailRow label="Playability" value={formatLabel(selected.playable_status)} />
                  <DetailRow label="Confirmation" value={splitValues(selected.identity_confirmation).map(formatLabel).join(", ")} />
                  <DetailRow label="Queer status" value={formatLabel(selected.queer_status)} />
                  <DetailRow label="Developer" value={selected.developer} />
                  <DetailRow label="Publisher" value={selected.publisher} />
                  <DetailRow label="Where they appear" value={splitValues(selected.content_availability).map(formatLabel).join(", ")} />
                  <DetailRow label="Platform / version" value={selected.platform_version} />
                  <DetailRow label="Intersectional context" value={selected.intersectionality_details} />
                  <DetailRow label="Research status" value={formatLabel(selected.research_status)} />
                </dl>

                {selected.notes ? (
                  <div className="mt-6 border-t border-[#e3e6f3] pt-5">
                    <p className="font-mono text-[9px] font-black uppercase tracking-[.18em] text-[#727b9d]">
                      Curatorial note
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#424a68]">
                      {selected.notes}
                    </p>
                  </div>
                ) : null}

                <div className="mt-6 flex flex-wrap gap-2">
                  {safeUrl(selected.evidence_source) ? (
                    <a
                      href={safeUrl(selected.evidence_source) || undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="pq-primary-button px-5 py-2.5 text-[10px]"
                    >
                      Open evidence source ↗
                    </a>
                  ) : null}
                  {safeUrl(selected.image_source_url) ? (
                    <a
                      href={safeUrl(selected.image_source_url) || undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="pq-gallery-link rounded-xl border border-[#d3d8ed] px-4 py-2.5 text-[10px] font-black uppercase tracking-[.1em] text-[#4f5fe7]"
                    >
                      Image source ↗
                    </a>
                  ) : null}
                </div>
                {selected.image_credit ? (
                  <p className="mt-4 text-[10px] leading-4 text-[#858ca8]">
                    Image credit: {selected.image_credit}
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
