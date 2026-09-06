"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CharacterColumn,
  CharacterRow,
  createEmptyCharacterRow,
} from "@/lib/characterSchema";
import AdminQueerSystemsManager from "@/components/AdminQueerSystemsManager";

type Field = {
  id: CharacterColumn;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?:
    | "text"
    | "number"
    | "url"
    | "date"
    | "textarea"
    | "select"
    | "multiselect";
  options?: { label: string; value: string }[];
  allowCustom?: boolean;
  wide?: boolean;
  rows?: number;
  help?: string;
};

type FieldGroup = {
  title: string;
  description: string;
  fields: Field[];
};

type Notice = { kind: "success" | "error"; text: string } | null;

const fieldGroups: FieldGroup[] = [
  {
    title: "Core data",
    description: "Basic information used to identify the record.",
    fields: [
      {
        id: "character_name",
        label: "Character name",
        placeholder: "e.g., Ellie",
        required: true,
      },
      {
        id: "game_title",
        label: "Game title",
        placeholder: "e.g., The Last of Us Part II",
        required: true,
      },
      {
        id: "release_year",
        label: "Release year",
        placeholder: "2020",
        type: "number",
      },
      {
        id: "developer",
        label: "Developer",
        type: "multiselect",
        allowCustom: true,
        help: "Select every credited developer or add another studio.",
      },
      {
        id: "publisher",
        label: "Publisher",
        type: "multiselect",
        allowCustom: true,
        help: "Select every credited publisher or add another company.",
      },
      {
        id: "game_scale",
        label: "Game scale",
        type: "multiselect",
        options: [
          { label: "AAA", value: "AAA" },
          { label: "AA", value: "AA" },
          { label: "Independent", value: "Independent" },
          { label: "Mobile", value: "Mobile" },
          { label: "Browser", value: "Browser" },
          { label: "Arcade", value: "Arcade" },
          { label: "Student / amateur", value: "Student / amateur" },
          { label: "Other", value: "Other" },
        ],
        help: "Select more than one when production or distribution crosses scales.",
      },
      {
        id: "genre",
        label: "Game genre",
        type: "multiselect",
        options: [
          { label: "Action", value: "Action" },
          { label: "Action-adventure", value: "Action-adventure" },
          { label: "Adventure", value: "Adventure" },
          { label: "Arcade action", value: "Arcade action" },
          { label: "Battle royale", value: "Battle royale" },
          { label: "Beat 'em up", value: "Beat 'em up" },
          { label: "Bullet hell", value: "Bullet hell" },
          { label: "Card game", value: "Card game" },
          { label: "Fighting", value: "Fighting" },
          { label: "First-person shooter", value: "First-person shooter" },
          { label: "Graphic adventure", value: "Graphic adventure" },
          { label: "Horror", value: "Horror" },
          { label: "Interactive fiction", value: "Interactive fiction" },
          { label: "MMO", value: "MMO" },
          { label: "Music / rhythm", value: "Music / rhythm" },
          { label: "Narrative adventure", value: "Narrative adventure" },
          { label: "Platformer", value: "Platformer" },
          { label: "Puzzle", value: "Puzzle" },
          { label: "Racing", value: "Racing" },
          { label: "Role-playing game", value: "Role-playing game" },
          { label: "Simulation", value: "Simulation" },
          { label: "Sports", value: "Sports" },
          { label: "Stealth", value: "Stealth" },
          { label: "Strategy", value: "Strategy" },
          { label: "Tactical role-playing", value: "Tactical role-playing" },
          { label: "Third-person shooter", value: "Third-person shooter" },
          { label: "Visual novel", value: "Visual novel" },
          { label: "Other", value: "Other" },
        ],
        allowCustom: true,
        wide: true,
        help: "Select every genre that applies. Multiple selections are stored in the dataset separated by semicolons.",
      },
      {
        id: "narrative_role",
        label: "Narrative role",
        type: "select",
        options: [
          { label: "Select", value: "" },
          { label: "Protagonist", value: "protagonist" },
          { label: "Deuteragonist", value: "deuteragonist" },
          { label: "Supporting character", value: "supporting_character" },
          { label: "Antagonist", value: "antagonist" },
          { label: "Not specified", value: "none" },
        ],
      },
    ],
  },
  {
    title: "Representation",
    description: "Identity, confirmation, and participation in the game.",
    fields: [
      {
        id: "playable_status",
        label: "Playability",
        type: "select",
        options: [
          { label: "Select", value: "" },
          { label: "Playable", value: "playable" },
          { label: "Non-playable", value: "non_playable" },
          { label: "Optional", value: "optional" },
          { label: "Unknown", value: "unknown" },
        ],
      },
      {
        id: "content_availability",
        label: "Where the character appears",
        type: "multiselect",
        options: [
          { label: "Main campaign / main story", value: "main_campaign" },
          {
            label: "Optional base-game content / side quest",
            value: "base_game_optional",
          },
          { label: "Expansion", value: "expansion" },
          { label: "DLC", value: "dlc" },
          {
            label: "Standalone expansion",
            value: "standalone_expansion",
          },
          {
            label: "Special / definitive edition or version",
            value: "special_edition",
          },
          { label: "Remake / remaster", value: "remake_remaster" },
          {
            label: "Update / patch / live-service content",
            value: "update_patch",
          },
          {
            label: "Platform- or region-specific content",
            value: "platform_region_specific",
          },
          { label: "Mod", value: "mod" },
          { label: "Other", value: "other" },
          { label: "Unknown / not recorded", value: "not_recorded" },
        ],
        wide: true,
        help: "Select every place where the documented representation appears. Record the exact DLC, edition, mod, patch, or platform name under Platform / version researched.",
      },
      {
        id: "gender",
        label: "Gender / gender identity",
        type: "multiselect",
        options: [
          { label: "Woman", value: "woman" },
          { label: "Man", value: "man" },
          { label: "Trans woman", value: "trans_woman" },
          { label: "Trans man", value: "trans_man" },
          { label: "Nonbinary", value: "non_binary" },
          { label: "Genderfluid", value: "genderfluid" },
          { label: "Agender", value: "agender" },
          { label: "Genderqueer", value: "genderqueer" },
          { label: "Other / self-described term", value: "other" },
          { label: "Unknown / inconclusive", value: "unknown" },
          { label: "Not recorded", value: "not_recorded" },
        ],
        help: "Select every explicitly documented gender identity. Use Unknown only when the evidence is inconclusive; use Not recorded when the field has not been documented. Intersex variation belongs in Identity categories and should be described precisely in the notes.",
      },
      {
        id: "sexuality",
        label: "Sexuality",
        type: "multiselect",
        options: [
          { label: "Lesbian", value: "lesbian" },
          { label: "Gay", value: "gay" },
          { label: "Bisexual", value: "bisexual" },
          { label: "Pansexual", value: "pansexual" },
          { label: "Asexual", value: "asexual" },
          { label: "Aromantic", value: "aromantic" },
          { label: "Queer", value: "queer" },
          { label: "Heterosexual", value: "heterosexual" },
          {
            label: "Player-defined / conditional",
            value: "player_defined",
          },
          { label: "Other / self-described term", value: "other" },
          { label: "Unknown / inconclusive", value: "unknown" },
          { label: "Not recorded", value: "not_recorded" },
        ],
        help: "Use player-defined when mutually exclusive outcomes depend on player choices. Use Unknown only when sexuality evidence is inconclusive; use Not recorded when sexuality has not been documented. Multiple selection is reserved for composite identities.",
      },
      {
        id: "identity_category",
        label: "Identity categories",
        type: "multiselect",
        options: [
          { label: "Gender identity", value: "gender_identity" },
          { label: "Sexual orientation", value: "sexual_orientation" },
          { label: "Romantic orientation", value: "romantic_orientation" },
          { label: "Intersex variation", value: "intersex_variation" },
          { label: "Gender expression", value: "gender_expression" },
          { label: "Other", value: "other" },
        ],
        help: "Analytical categories; they do not replace the terms used by the character.",
      },
      {
        id: "identity_confirmation",
        label: "Identity confirmation",
        type: "multiselect",
        options: [
          { label: "Explicit in game", value: "explicit_in_game" },
          {
            label: "Not explicit in game",
            value: "not_explicit_in_game",
          },
          { label: "Confirmed by development team", value: "developer_confirmed" },
          { label: "External source", value: "external_source" },
          { label: "Ambiguous", value: "ambiguous" },
        ],
        help: "Select every confirmation channel supported by the evidence. Explicit and not explicit in game are mutually exclusive; Ambiguous is used alone when the evidence remains inconclusive.",
      },
      {
        id: "queer_status",
        label: "Queer status",
        type: "select",
        options: [
          { label: "Select", value: "" },
          { label: "Confirmed", value: "confirmed" },
          { label: "Not confirmed", value: "not confirmed" },
          { label: "Ambiguous", value: "ambiguous" },
        ],
      },
    ],
  },
  {
    title: "Intersectionality and evidence",
    description: "Context needed to support and interpret the entry.",
    fields: [
      {
        id: "intersectionality_present",
        label: "Intersectionality categories",
        type: "multiselect",
        options: [
          { label: "Race", value: "race" },
          { label: "Ethnicity", value: "ethnicity" },
          { label: "Disability", value: "disability" },
          { label: "Religion", value: "religion" },
          { label: "Class", value: "class" },
          { label: "Age", value: "age" },
          { label: "Nationality / migration", value: "nationality_migration" },
          { label: "Other", value: "other" },
          { label: "None documented", value: "no" },
        ],
        wide: true,
        help: "Select the broad categories supported by the evidence. Add the specific identities or context below.",
      },
      {
        id: "intersectionality_details",
        label: "Specific identities / context",
        type: "multiselect",
        options: [
          { label: "Black", value: "Black" },
          { label: "Asian", value: "Asian" },
          { label: "Indigenous", value: "Indigenous" },
          { label: "Two-Spirit", value: "Two-Spirit" },
          { label: "Person of Color", value: "Person of Color" },
          { label: "Mexican", value: "Mexican" },
          { label: "Mexican-American", value: "Mexican-American" },
          { label: "African", value: "African" },
          { label: "Indian", value: "Indian" },
          { label: "Disability", value: "Disability" },
          { label: "Neurodivergence", value: "Neurodivergence" },
          { label: "Religious context", value: "Religious context" },
          { label: "Class / socioeconomic context", value: "Class / socioeconomic context" },
          { label: "Nationality / cultural context", value: "Nationality / cultural context" },
          { label: "Migration / refugee context", value: "Migration / refugee context" },
          { label: "Family / community context", value: "Family / community context" },
          { label: "Historical context", value: "Historical context" },
          { label: "Fictional species / nonhuman context", value: "Fictional species / nonhuman context" },
          { label: "None documented", value: "None documented" },
        ],
        allowCustom: true,
        wide: true,
        help: "Select or add the specific identity, cultural term, disability, or social context supported by the evidence.",
      },
      {
        id: "evidence_source",
        label: "Source / evidence",
        placeholder: "Scene, dialogue, official biography, article, or URL",
        type: "textarea",
        rows: 4,
        wide: true,
      },
      {
        id: "notes",
        label: "Curatorial notes",
        type: "textarea",
        rows: 4,
        wide: true,
      },
    ],
  },
  {
    title: "Image",
    description: "File used on the site and attribution information.",
    fields: [
      {
        id: "character_image",
        label: "Image path",
        placeholder: "/images/ellie.jpg",
        wide: true,
      },
      { id: "image_credit", label: "Image credit", wide: true },
      {
        id: "image_source_url",
        label: "Image source URL",
        placeholder: "https://…",
        type: "url",
        wide: true,
      },
    ],
  },
  {
    title: "Coverage and provenance",
    description:
      "Metadata that makes research gaps, language, and stage visible.",
    fields: [
      {
        id: "research_status",
        label: "Research status",
        type: "select",
        options: [
          { label: "Select", value: "" },
          { label: "Identified / queued", value: "identified" },
          { label: "In research", value: "in_progress" },
          { label: "Reviewed", value: "reviewed" },
          { label: "Needs verification", value: "needs_verification" },
        ],
      },
      {
        id: "evidence_confidence",
        label: "Evidence confidence",
        type: "select",
        options: [
          { label: "Select", value: "" },
          { label: "Low", value: "low" },
          { label: "Medium", value: "medium" },
          { label: "High", value: "high" },
        ],
      },
      {
        id: "platform_version",
        label: "Platform / version researched",
        type: "multiselect",
        allowCustom: true,
        options: [
          { label: "PC", value: "PC" },
          { label: "Mac", value: "Mac" },
          { label: "Linux", value: "Linux" },
          { label: "Browser", value: "Browser" },
          { label: "Mobile", value: "Mobile" },
          { label: "Arcade", value: "Arcade" },
          { label: "PlayStation", value: "PlayStation" },
          { label: "Xbox", value: "Xbox" },
          { label: "Nintendo", value: "Nintendo" },
          { label: "Multiple platforms", value: "Multiple platforms" },
          { label: "Various", value: "Various" },
        ],
        wide: true,
        help: "Select platforms already used in the dataset or add a specific console, DLC, patch, localization, or version.",
      },
      {
        id: "discovery_source",
        label: "How the case was discovered",
        type: "multiselect",
        allowCustom: true,
        options: [
          {
            label: "LGBTQ Video Game Archive",
            value: "LGBTQ Video Game Archive",
          },
          { label: "Represent Me", value: "Represent Me" },
          { label: "Official game material", value: "Official game material" },
          {
            label: "Developer / publisher statement",
            value: "Developer / publisher statement",
          },
          { label: "Academic research", value: "Academic research" },
          { label: "Press / media", value: "Press / media" },
          { label: "Community submission", value: "Community submission" },
          { label: "Independent research", value: "Independent research" },
          { label: "Wikipedia / Wikidata", value: "Wikipedia / Wikidata" },
          { label: "Other", value: "Other" },
        ],
        wide: true,
        help: "Select every source that led to the case; detailed citations remain in Source / evidence.",
      },
      {
        id: "last_reviewed",
        label: "Last reviewed",
        type: "date",
      },
    ],
  },
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function ApiError(message: string) {
  return new Error(message);
}

export default function AdminCharacterManager() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [characters, setCharacters] = useState<CharacterRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CharacterRow>(createEmptyCharacterRow);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [activeDataset, setActiveDataset] = useState<
    "characters" | "systems"
  >("characters");
  const [systemsDirty, setSystemsDirty] = useState(false);
  const [systemsCount, setSystemsCount] = useState(0);

  const existingMultiValueOptions = useMemo(() => {
    const fields: CharacterColumn[] = [
      "developer",
      "publisher",
      "platform_version",
      "discovery_source",
    ];

    return Object.fromEntries(
      fields.map((field) => [
        field,
        Array.from(
          new Set(
            characters.flatMap((character) =>
              splitMultiValue(character[field]),
            ),
          ),
        )
          .sort((left, right) => left.localeCompare(right))
          .map((item) => ({ label: item, value: item })),
      ]),
    ) as Partial<
      Record<CharacterColumn, { label: string; value: string }[]>
    >;
  }, [characters]);

  const selectedCharacter = useMemo(
    () =>
      characters.find((character) => character.character_id === selectedId) ||
      null,
    [characters, selectedId],
  );

  const dirty = useMemo(() => {
    const original = selectedCharacter || createEmptyCharacterRow();
    return JSON.stringify(draft) !== JSON.stringify(original);
  }, [draft, selectedCharacter]);

  const filteredCharacters = useMemo(() => {
    const query = normalize(search.trim());
    if (!query) return characters;

    return characters.filter((character) =>
      normalize(
        `${character.character_name} ${character.game_title} ${character.developer}`,
      ).includes(query),
    );
  }, [characters, search]);

  useEffect(() => {
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
    }

    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [dirty]);

  async function adminRequest(path: string, init?: RequestInit) {
    const response = await fetch(path, {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw ApiError(body?.error || "The operation could not be completed.");
    }

    return response;
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password) return;

    setBusy(true);
    setNotice(null);

    try {
      const response = await adminRequest("/api/admin/characters");
      const data = (await response.json()) as { characters: CharacterRow[] };
      setCharacters(data.characters);
      setAuthenticated(true);

      if (data.characters[0]) {
        setSelectedId(data.characters[0].character_id);
        setDraft(data.characters[0]);
      } else {
        setSelectedId(null);
        setDraft(createEmptyCharacterRow());
      }
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not sign in.",
      });
    } finally {
      setBusy(false);
    }
  }

  function canDiscardChanges() {
    return (
      !dirty ||
      window.confirm("Discard the unsaved changes?")
    );
  }

  function selectCharacter(character: CharacterRow) {
    if (!canDiscardChanges()) return;
    setSelectedId(character.character_id);
    setDraft(character);
    setNotice(null);
  }

  function startNewCharacter() {
    if (!canDiscardChanges()) return;
    setSelectedId(null);
    setDraft(createEmptyCharacterRow());
    setNotice(null);
  }

  function updateField(id: CharacterColumn, value: string) {
    setDraft((current) => ({ ...current, [id]: value }));
    setNotice(null);
  }

  async function saveCharacter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);

    try {
      const isNew = !draft.character_id;
      const response = await adminRequest("/api/admin/characters", {
        method: isNew ? "POST" : "PUT",
        body: JSON.stringify({ character: draft }),
      });
      const data = (await response.json()) as { character: CharacterRow };

      setCharacters((current) =>
        isNew
          ? [...current, data.character]
          : current.map((character) =>
              character.character_id === data.character.character_id
                ? data.character
                : character,
            ),
      );
      setSelectedId(data.character.character_id);
      setDraft(data.character);
      setNotice({
        kind: "success",
        text: isNew
          ? "Character added and CSV updated."
          : "Changes saved to the CSV.",
      });
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not save.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function deleteCharacter() {
    if (!draft.character_id) return;
    if (
      !window.confirm(
        `Permanently delete ${draft.character_name || "this character"} from the CSV?`,
      )
    ) {
      return;
    }

    setBusy(true);
    setNotice(null);

    try {
      await adminRequest(
        `/api/admin/characters?id=${encodeURIComponent(draft.character_id)}`,
        { method: "DELETE" },
      );
      const remaining = characters.filter(
        (character) => character.character_id !== draft.character_id,
      );
      setCharacters(remaining);
      setSelectedId(remaining[0]?.character_id || null);
      setDraft(remaining[0] || createEmptyCharacterRow());
      setNotice({ kind: "success", text: "Character deleted from the CSV." });
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not delete.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function downloadBackup() {
    setBusy(true);
    setNotice(null);

    try {
      const response = await adminRequest(
        "/api/admin/characters?format=csv",
      );
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "pressq_seed_dataset.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not download.",
      });
    } finally {
      setBusy(false);
    }
  }

  function changeDataset(next: "characters" | "systems") {
    if (next === activeDataset) return;
    const hasUnsavedChanges =
      activeDataset === "characters" ? dirty : systemsDirty;

    if (
      hasUnsavedChanges &&
      !window.confirm(
        "Discard the unsaved changes in this tab?",
      )
    ) {
      return;
    }

    if (activeDataset === "systems") setSystemsDirty(false);
    setActiveDataset(next);
  }

  function logout() {
    if (
      (dirty || systemsDirty) &&
      !window.confirm("Sign out and discard the unsaved changes?")
    ) {
      return;
    }

    setAuthenticated(false);
    setPassword("");
    setNotice(null);
    setActiveDataset("characters");
    setSystemsDirty(false);
  }

  if (!authenticated) {
    return (
      <section className="mx-auto max-w-xl overflow-hidden rounded-[2rem] border border-[#dfe3f3] bg-white p-7 shadow-[0_24px_70px_rgba(49,63,145,0.12)] sm:p-10">
        <p className="pq-eyebrow">Restricted access</p>
        <h2 className="mt-3 text-2xl font-black text-[#12152b]">
          Sign in with the admin password
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#646b89]">
          The password is validated only by the server and is not stored in the
          browser.
        </p>

        <form onSubmit={login} className="mt-7 space-y-4">
          <label className="block">
            <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#4f5fe7]">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              autoFocus
              className="mt-2 w-full rounded-2xl border border-[#d3d8ed] bg-white px-4 py-3 text-[#12152b] outline-none transition focus:border-[#4f5fe7] focus:ring-4 focus:ring-[#4f5fe7]/10"
            />
          </label>

          <button
            type="submit"
            disabled={busy || !password}
            className="pq-primary-button w-full px-6 py-4 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <NoticeBanner notice={notice} />
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <nav
        aria-label="Admin datasets"
        className="flex flex-col gap-2 rounded-[1.5rem] border border-[#dfe3f3] bg-white p-2 shadow-[0_14px_38px_rgba(49,63,145,0.08)] sm:flex-row"
      >
        <button
          type="button"
          onClick={() => changeDataset("characters")}
          className={`flex flex-1 items-center justify-between rounded-[1.1rem] px-5 py-3 text-left text-sm font-black transition ${
            activeDataset === "characters"
              ? "bg-[#171d52] text-white shadow-sm"
              : "text-[#646b89] hover:bg-[#f4f5fb]"
          }`}
        >
          <span>Characters</span>
          <span className="rounded-full bg-white/12 px-2.5 py-1 font-mono text-[10px]">
            {characters.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => changeDataset("systems")}
          className={`flex flex-1 items-center justify-between rounded-[1.1rem] px-5 py-3 text-left text-sm font-black transition ${
            activeDataset === "systems"
              ? "bg-[#171d52] text-white shadow-sm"
              : "text-[#646b89] hover:bg-[#f4f5fb]"
          }`}
        >
          <span>Queer systems</span>
          <span className="rounded-full bg-white/12 px-2.5 py-1 font-mono text-[10px]">
            {systemsCount}
          </span>
        </button>
      </nav>

      {activeDataset === "characters" ? (
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="h-fit overflow-hidden rounded-[1.8rem] border border-[#dfe3f3] bg-white shadow-[0_18px_48px_rgba(49,63,145,0.1)] xl:sticky xl:top-6">
        <div className="border-b border-[#e5e8f5] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="pq-eyebrow">Characters</p>
              <p className="mt-1 text-sm font-bold text-[#646b89]">
                {characters.length} records
              </p>
            </div>
            <button
              type="button"
              onClick={startNewCharacter}
              className="pq-primary-button px-4 py-2.5 text-[10px]"
            >
              + New
            </button>
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search character or game"
            className="mt-4 w-full rounded-2xl border border-[#d3d8ed] bg-[#f8f9fd] px-4 py-3 text-sm outline-none transition placeholder:text-[#9da3b9] focus:border-[#4f5fe7]"
          />
        </div>

        <div className="max-h-[55vh] space-y-2 overflow-y-auto p-3 xl:max-h-[calc(100vh-270px)]">
          {filteredCharacters.map((character) => {
            const selected = character.character_id === selectedId;
            return (
              <button
                key={character.character_id}
                type="button"
                onClick={() => selectCharacter(character)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  selected
                    ? "border-[#4f5fe7] bg-[#eef0ff] shadow-sm"
                    : "border-transparent hover:border-[#dfe3f3] hover:bg-[#f8f9fd]"
                }`}
              >
                <span className="block font-black text-[#12152b]">
                  {character.character_name || "Unnamed"}
                </span>
                <span className="mt-1 block text-xs text-[#646b89]">
                  {character.game_title || "Game not provided"}
                </span>
              </button>
            );
          })}

          {filteredCharacters.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[#7b819c]">
              No records found.
            </p>
          ) : null}
        </div>

        <div className="grid gap-2 border-t border-[#e5e8f5] p-4 sm:grid-cols-2 xl:grid-cols-1">
          <button
            type="button"
            onClick={downloadBackup}
            disabled={busy}
            className="pq-secondary-button px-4 py-3 text-[10px] disabled:opacity-50"
          >
            Download CSV backup
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-[#dfe3f3] px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#646b89] transition hover:bg-[#f4f5fb]"
          >
            Sign out
          </button>
        </div>
      </aside>

      <form
        onSubmit={saveCharacter}
        className="overflow-hidden rounded-[1.8rem] border border-[#dfe3f3] bg-white shadow-[0_18px_48px_rgba(49,63,145,0.1)]"
      >
        <div className="flex flex-col gap-4 border-b border-[#e5e8f5] bg-[#171d52] p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.22em] text-[#9be8f5]">
              {draft.character_id
                ? `Record #${draft.character_id}`
                : "New record"}
            </p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              {draft.character_name || "New character"}
            </h2>
          </div>
          {dirty ? (
            <span className="w-fit rounded-full bg-[#ffdf70] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#584600]">
              Unsaved changes
            </span>
          ) : null}
        </div>

        <div className="space-y-10 p-6 sm:p-8 lg:p-10">
          <NoticeBanner notice={notice} />

          {fieldGroups.map((group) => (
            <fieldset key={group.title}>
              <legend className="text-xl font-black text-[#12152b]">
                {group.title}
              </legend>
              <p className="mt-1 text-sm text-[#7b819c]">
                {group.description}
              </p>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {group.fields.map((field) => (
                  <CharacterField
                    key={field.id}
                    field={{
                      ...field,
                      options: [
                        ...(field.options || []),
                        ...(existingMultiValueOptions[field.id] || []),
                      ],
                    }}
                    value={draft[field.id]}
                    onChange={(value) => updateField(field.id, value)}
                  />
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#e5e8f5] bg-[#f8f9fd] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            {draft.character_id ? (
              <button
                type="button"
                onClick={deleteCharacter}
                disabled={busy}
                className="rounded-full border border-[#f0b6c7] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#b72755] transition hover:bg-[#fff0f5] disabled:opacity-50"
              >
                Delete character
              </button>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={busy || !dirty}
            className="pq-primary-button px-7 py-4 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save to dataset"}
          </button>
        </div>
      </form>

      <p className="text-xs leading-relaxed text-[#7b819c] xl:col-start-2">
        Changes are written to <code>src/data/pressq_seed_dataset.csv</code>.
        Serverless hosting usually does not provide persistent disk storage; for
        production administration, the next step is to connect a database.
      </p>
        </div>
      ) : (
        <AdminQueerSystemsManager
          password={password}
          onDirtyChange={setSystemsDirty}
          onCountChange={setSystemsCount}
          onLogout={logout}
        />
      )}
    </div>
  );
}

function CharacterField({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.type === "multiselect") {
    return (
      <CharacterMultiSelect
        field={field}
        value={value}
        onChange={onChange}
      />
    );
  }

  const baseClass =
    "mt-2 w-full rounded-2xl border border-[#d3d8ed] bg-white px-4 py-3 text-sm text-[#12152b] outline-none transition placeholder:text-[#9da3b9] focus:border-[#4f5fe7] focus:ring-4 focus:ring-[#4f5fe7]/10";
  const hasListedOption = field.options?.some(
    (option) => option.value === value,
  );

  return (
    <label className={field.wide ? "block md:col-span-2" : "block"}>
      <span className="font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#4f5fe7]">
        {field.label}
        {field.required ? " *" : ""}
      </span>

      {field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          rows={field.rows || 3}
          required={field.required}
          className={`${baseClass} resize-y`}
        />
      ) : field.type === "select" ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={field.required}
          className={baseClass}
        >
          {value && !hasListedOption ? (
            <option value={value}>{value} (current value)</option>
          ) : null}
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type || "text"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          min={field.type === "number" ? "1950" : undefined}
          max={field.type === "number" ? "2100" : undefined}
          className={baseClass}
        />
      )}

      {field.help ? (
        <span className="mt-1.5 block text-xs leading-relaxed text-[#898fa8]">
          {field.help}
        </span>
      ) : null}
    </label>
  );
}

function splitMultiValue(value: string) {
  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isUndocumentedIntersectionalityDetail(value: string) {
  return ["none", "none documented", "no details"].includes(normalize(value));
}

function CharacterMultiSelect({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string;
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const selected = splitMultiValue(value);
  const uniqueOptions = new Map(
    (field.options || [])
      .filter((option) => option.value)
      .map((option) => [option.value, option]),
  );
  const knownValues = new Set(uniqueOptions.keys());
  const legacyValues = selected.filter((item) => !knownValues.has(item));
  const allOptions = [
    ...uniqueOptions.values(),
    ...legacyValues.map((item) => ({
      label: `${item} (current value)`,
      value: item,
    })),
  ];
  const normalizedQuery = normalize(query.trim());
  const matchingOption = allOptions.find(
    (option) => normalize(option.value) === normalizedQuery,
  );
  const visibleOptions = normalizedQuery
    ? allOptions.filter((option) =>
        normalize(`${option.label} ${option.value}`).includes(normalizedQuery),
      )
    : allOptions;

  function toggle(optionValue: string) {
    const isSelected = selected.includes(optionValue);
    let next = isSelected
      ? selected.filter((item) => item !== optionValue)
      : [...selected, optionValue];

    if (field.id === "intersectionality_present") {
      if (optionValue === "no" && !isSelected) next = ["no"];
      if (optionValue !== "no" && !isSelected) {
        next = next.filter((item) => item !== "no");
      }
    }

    if (field.id === "intersectionality_details") {
      if (isUndocumentedIntersectionalityDetail(optionValue) && !isSelected) {
        next = [optionValue];
      }
      if (!isUndocumentedIntersectionalityDetail(optionValue) && !isSelected) {
        next = next.filter(
          (item) => !isUndocumentedIntersectionalityDetail(item),
        );
      }
    }

    if (field.id === "identity_confirmation" && !isSelected) {
      if (optionValue === "ambiguous") {
        next = [optionValue];
      } else {
        next = next.filter((item) => item !== "ambiguous");
      }

      if (optionValue === "explicit_in_game") {
        next = next.filter((item) => item !== "not_explicit_in_game");
      }
      if (optionValue === "not_explicit_in_game") {
        next = next.filter((item) => item !== "explicit_in_game");
      }
    }

    if (field.id === "content_availability" && !isSelected) {
      if (optionValue === "not_recorded") {
        next = [optionValue];
      } else {
        next = next.filter((item) => item !== "not_recorded");
      }
    }

    onChange(next.join("; "));
  }

  function addCustomValue() {
    const nextValue = query.trim();
    if (!nextValue) return;

    const valueToAdd = matchingOption?.value || nextValue;
    if (!selected.includes(valueToAdd)) {
      const next =
        field.id === "intersectionality_details"
          ? isUndocumentedIntersectionalityDetail(valueToAdd)
            ? [valueToAdd]
            : selected
                .filter(
                  (item) => !isUndocumentedIntersectionalityDetail(item),
                )
                .concat(valueToAdd)
          : [...selected, valueToAdd];
      onChange(next.join("; "));
    }
    setQuery("");
  }

  return (
    <div className={field.wide ? "md:col-span-2" : undefined}>
      <span className="font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#4f5fe7]">
        {field.label}
        {field.required ? " *" : ""}
      </span>

      <details className="pq-multi-select group mt-2 rounded-2xl border border-[#d3d8ed] bg-white open:border-[#4f5fe7] open:ring-4 open:ring-[#4f5fe7]/10">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm text-[#12152b] marker:hidden">
          <span className={selected.length ? "font-bold" : "text-[#9da3b9]"}>
            {selected.length
              ? `${selected.length} ${selected.length === 1 ? "option selected" : "options selected"}`
              : "Select one or more options"}
          </span>
          <span className="text-[#4f5fe7] transition group-open:rotate-180" aria-hidden="true">
            ▾
          </span>
        </summary>

        {field.allowCustom ? (
          <div className="flex flex-col gap-2 border-t border-[#e5e8f5] p-3 sm:flex-row">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                addCustomValue();
              }}
              placeholder="Search or type another value"
              className="min-w-0 flex-1 rounded-xl border border-[#d3d8ed] px-3 py-2.5 text-sm text-[#12152b] outline-none placeholder:text-[#9da3b9] focus:border-[#4f5fe7]"
            />
            {query.trim() ? (
              <button
                type="button"
                onClick={addCustomValue}
                className="rounded-xl bg-[#171d52] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-white transition hover:bg-[#2636b5]"
              >
                {matchingOption ? "Select" : "Add value"}
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="grid max-h-72 gap-2 overflow-y-auto border-t border-[#e5e8f5] p-3 sm:grid-cols-2">
          {visibleOptions.map((option) => {
            const checked = selected.includes(option.value);
            return (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                  checked
                    ? "border-[#4f5fe7] bg-[#eef0ff] text-[#2636b5]"
                    : "border-[#e5e8f5] text-[#646b89] hover:border-[#9ba5ed]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(option.value)}
                  className="h-4 w-4 accent-[#4f5fe7]"
                />
                <span>{option.label}</span>
              </label>
            );
          })}
          {visibleOptions.length === 0 ? (
            <p className="px-2 py-3 text-sm text-[#898fa8] sm:col-span-2">
              No matching option. Add this value above.
            </p>
          ) : null}
        </div>
      </details>

      {selected.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Selected options">
          {selected.map((item) => {
            const label = allOptions.find((option) => option.value === item)?.label || item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggle(item)}
                className="rounded-full bg-[#eef0ff] px-2.5 py-1 text-[10px] font-black text-[#3545d3] transition hover:bg-[#dfe3ff]"
                title={`Remove ${label}`}
              >
                {label.replace(" (current value)", "")} ×
              </button>
            );
          })}
        </div>
      ) : null}

      {field.help ? (
        <span className="mt-1.5 block text-xs leading-relaxed text-[#898fa8]">
          {field.help}
        </span>
      ) : null}
    </div>
  );
}

function NoticeBanner({ notice }: { notice: Notice }) {
  if (!notice) return null;

  return (
    <p
      role="status"
      className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-bold ${
        notice.kind === "success"
          ? "border-[#a7dfd2] bg-[#effbf8] text-[#176755]"
          : "border-[#f0b6c7] bg-[#fff0f5] text-[#a51f4b]"
      }`}
    >
      {notice.text}
    </p>
  );
}
