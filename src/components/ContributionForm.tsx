"use client";

import { FormEvent, useState } from "react";

const fields = [
  {
    id: "characterName",
    label: "Character name",
    placeholder: "Example: Ellie",
  },
  {
    id: "gameTitle",
    label: "Game title",
    placeholder: "Example: The Last of Us Part II",
  },
  {
    id: "releaseYear",
    label: "Release year",
    placeholder: "Example: 2020",
  },
  {
    id: "developer",
    label: "Developer / studio",
    placeholder: "Example: Naughty Dog",
  },
  {
    id: "identityDetails",
    label: "Identity details",
    placeholder: "Gender, sexuality, identity category, labels",
  },
  {
    id: "playableStatus",
    label: "Playable status",
    placeholder: "Playable, non-playable, optional, unknown",
  },
  {
    id: "intersectionality",
    label: "Intersectionality notes",
    placeholder: "Race, ethnicity, disability, religion, class, etc.",
  },
  {
    id: "sourceUrl",
    label: "Source link",
    placeholder: "Wiki, developer source, article, transcript, video, etc.",
  },
  {
    id: "imageSource",
    label: "Image source / credit",
    placeholder: "Optional screenshot, press image, wiki image, or credit line",
  },
] as const;

type FieldId = (typeof fields)[number]["id"] | "evidence" | "contact";

type FormValues = Record<FieldId, string>;

const initialValues: FormValues = {
  characterName: "",
  gameTitle: "",
  releaseYear: "",
  developer: "",
  identityDetails: "",
  playableStatus: "",
  intersectionality: "",
  sourceUrl: "",
  imageSource: "",
  evidence: "",
  contact: "",
};

function buildDraft(values: FormValues) {
  return [
    "PRSM character contribution",
    "",
    `Character name: ${values.characterName || "Not provided"}`,
    `Game title: ${values.gameTitle || "Not provided"}`,
    `Release year: ${values.releaseYear || "Not provided"}`,
    `Developer / studio: ${values.developer || "Not provided"}`,
    `Identity details: ${values.identityDetails || "Not provided"}`,
    `Playable status: ${values.playableStatus || "Not provided"}`,
    `Intersectionality notes: ${values.intersectionality || "Not provided"}`,
    `Source link: ${values.sourceUrl || "Not provided"}`,
    `Image source / credit: ${values.imageSource || "Not provided"}`,
    "",
    "Evidence / context:",
    values.evidence || "Not provided",
    "",
    `Contributor contact: ${values.contact || "Not provided"}`,
    "",
    "Review note: PRSM v1.0 is a beta research prototype. Suggestions should be reviewed before entering the public dataset.",
  ].join("\n");
}

export default function ContributionForm() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);

  function updateValue(id: FieldId, value: string) {
    setValues((current) => ({ ...current, [id]: value }));
    setCopied(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDraft(buildDraft(values));
    setCopied(false);
  }

  async function copyDraft() {
    const text = draft || buildDraft(values);
    setDraft(text);

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <label key={field.id} className="block">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-cyan-300">
              {field.label}
            </span>
            <input
              value={values[field.id]}
              onChange={(event) => updateValue(field.id, event.target.value)}
              placeholder={field.placeholder}
              className="mt-2 w-full border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300"
            />
          </label>
        ))}
      </div>

      <label className="block">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-cyan-300">
          Evidence / context
        </span>
        <textarea
          value={values.evidence}
          onChange={(event) => updateValue("evidence", event.target.value)}
          placeholder="Describe where the representation appears, how it is confirmed, and any context that helps review the entry."
          rows={5}
          className="mt-2 w-full resize-y border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300"
        />
      </label>

      <label className="block">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-cyan-300">
          Contributor contact
        </span>
        <input
          value={values.contact}
          onChange={(event) => updateValue("contact", event.target.value)}
          placeholder="Optional email, handle, or name for follow-up"
          className="mt-2 w-full border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300"
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          className="inline-flex w-full justify-center rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 px-6 py-4 text-sm font-black text-white shadow-[0_0_32px_rgba(34,211,238,0.22)] transition hover:scale-[1.01] sm:w-auto"
        >
          Build contribution draft
        </button>

        <button
          type="button"
          onClick={copyDraft}
          className="inline-flex w-full justify-center rounded-full border border-white/15 bg-white/10 px-6 py-4 text-sm font-black text-white transition hover:border-cyan-300/50 hover:text-cyan-300 sm:w-auto"
        >
          {copied ? "Copied" : "Copy draft"}
        </button>
      </div>

      {draft ? (
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-fuchsia-300">
            Submission draft
          </span>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={12}
            className="mt-2 w-full resize-y border border-white/10 bg-black/50 px-4 py-3 font-mono text-xs leading-relaxed text-slate-200 outline-none focus:border-fuchsia-300"
          />
        </label>
      ) : null}
    </form>
  );
}
