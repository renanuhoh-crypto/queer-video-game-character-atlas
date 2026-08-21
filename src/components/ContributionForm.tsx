"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";

type FieldId =
  | "characterName"
  | "gameTitle"
  | "releaseYear"
  | "developer"
  | "identityDetails"
  | "playableStatus"
  | "intersectionality"
  | "sourceUrl"
  | "imageSource"
  | "evidence"
  | "contact";

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

const steps = [
  { number: "01", label: "Character" },
  { number: "02", label: "Evidence" },
  { number: "03", label: "Review" },
];

function buildDraft(values: FormValues) {
  return [
    "Press Q character contribution",
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
    "Review note: This is a research lead and must be reviewed before entering the public Press Q dataset.",
  ].join("\n");
}

export default function ContributionForm() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);

  function updateValue(id: FieldId, value: string) {
    setValues((current) => ({ ...current, [id]: value }));
    setCopied(false);
    setDraft("");
  }

  function nextStep() {
    if (step === 0 && (!values.characterName.trim() || !values.gameTitle.trim())) {
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < steps.length - 1) {
      nextStep();
      return;
    }
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

  function downloadDraft() {
    const text = draft || buildDraft(values);
    setDraft(text);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `pressq-contribution-${values.characterName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "draft"}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="pq-contribution-shell">
      <div className="pq-contribution-orb pq-contribution-orb--one" aria-hidden="true" />
      <div className="pq-contribution-orb pq-contribution-orb--two" aria-hidden="true" />

      <nav aria-label="Contribution progress" className="relative z-10 grid grid-cols-3 gap-2">
        {steps.map((item, index) => (
          <button
            key={item.number}
            type="button"
            onClick={() => index <= step && setStep(index)}
            disabled={index > step}
            className={`pq-contribution-step ${index === step ? "is-active" : ""} ${index < step ? "is-complete" : ""}`}
            aria-current={index === step ? "step" : undefined}
          >
            <span>{item.number}</span>
            <strong>{item.label}</strong>
          </button>
        ))}
      </nav>

      <form onSubmit={handleSubmit} className="relative z-10 mt-7">
        <div key={step} className="pq-contribution-slide">
          {step === 0 ? (
            <section>
              <p className="pq-contribution-kicker">Start with the record</p>
              <h3 className="mt-2 text-2xl font-black italic text-white sm:text-3xl">
                Who are we documenting?
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Character and game are required so the research lead can be identified.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <TextField id="characterName" label="Character name *" value={values.characterName} onChange={updateValue} placeholder="Example: Ellie" required />
                <TextField id="gameTitle" label="Game title *" value={values.gameTitle} onChange={updateValue} placeholder="Example: The Last of Us Part II" required />
                <TextField id="releaseYear" label="Release year" value={values.releaseYear} onChange={updateValue} placeholder="Example: 2020" />
                <TextField id="developer" label="Developer / studio" value={values.developer} onChange={updateValue} placeholder="Example: Naughty Dog" />
                <label className="block sm:col-span-2">
                  <FieldLabel>Playable status</FieldLabel>
                  <select value={values.playableStatus} onChange={(event) => updateValue("playableStatus", event.target.value)} className="pq-contribution-input">
                    <option value="">Select</option>
                    <option value="playable">Playable</option>
                    <option value="non_playable">Non-playable</option>
                    <option value="optional">Optional</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </label>
              </div>
            </section>
          ) : null}

          {step === 1 ? (
            <section>
              <p className="pq-contribution-kicker">Evidence before inference</p>
              <h3 className="mt-2 text-2xl font-black italic text-white sm:text-3xl">
                What supports the entry?
              </h3>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <TextField id="identityDetails" label="Identity details" value={values.identityDetails} onChange={updateValue} placeholder="Gender, sexuality, categories, labels" />
                <TextField id="intersectionality" label="Intersectionality" value={values.intersectionality} onChange={updateValue} placeholder="Race, disability, class, nationality…" />
                <TextField id="sourceUrl" label="Source link" value={values.sourceUrl} onChange={updateValue} placeholder="Official source, transcript, video, article…" />
                <TextField id="imageSource" label="Image source / credit" value={values.imageSource} onChange={updateValue} placeholder="Optional source and credit line" />
                <label className="block sm:col-span-2">
                  <FieldLabel>Evidence / context</FieldLabel>
                  <textarea
                    value={values.evidence}
                    onChange={(event) => updateValue("evidence", event.target.value)}
                    placeholder="Describe where the representation appears, how it is confirmed, and any ambiguity or version limitations."
                    rows={6}
                    className="pq-contribution-input resize-y"
                  />
                </label>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section>
              <p className="pq-contribution-kicker">Review card</p>
              <h3 className="mt-2 text-2xl font-black italic text-white sm:text-3xl">
                Ready for the research queue
              </h3>
              <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_.75fr]">
                <div className="rounded-[1.4rem] border border-white/10 bg-white/[.055] p-5">
                  <p className="font-mono text-[9px] font-black uppercase tracking-[.2em] text-[#83e9f5]">Character lead</p>
                  <p className="mt-3 text-2xl font-black italic text-white">{values.characterName || "Unnamed character"}</p>
                  <p className="mt-1 text-sm text-slate-300">{values.gameTitle || "Game not provided"}</p>
                  <dl className="mt-5 grid gap-3 text-xs text-slate-400 sm:grid-cols-2">
                    <div><dt className="font-bold text-slate-200">Identity</dt><dd className="mt-1">{values.identityDetails || "Not provided"}</dd></div>
                    <div><dt className="font-bold text-slate-200">Source</dt><dd className="mt-1 break-words">{values.sourceUrl || "Not provided"}</dd></div>
                  </dl>
                </div>
                <label className="block">
                  <FieldLabel>Contributor contact</FieldLabel>
                  <input
                    value={values.contact}
                    onChange={(event) => updateValue("contact", event.target.value)}
                    placeholder="Optional email, handle, or name"
                    className="pq-contribution-input"
                  />
                  <span className="mt-2 block text-xs leading-5 text-slate-400">Used only for possible research follow-up.</span>
                </label>
              </div>
            </section>
          ) : null}
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0}
            className="pq-contribution-back disabled:invisible"
          >
            ← Back
          </button>
          <button
            type="submit"
            className="space-hero-button space-hero-button--primary px-7 py-3 text-xs"
          >
            {step === steps.length - 1 ? "Build contribution draft" : "Continue →"}
          </button>
        </div>
      </form>

      {draft ? (
        <section className="relative z-10 mt-7 border-t border-white/10 pt-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="pq-contribution-kicker">Draft generated</p>
              <h3 className="mt-2 text-xl font-black italic text-white">Review, copy or download</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={copyDraft} className="pq-chart-download">{copied ? "Copied ✓" : "Copy"}</button>
              <button type="button" onClick={downloadDraft} className="pq-chart-download">TXT ↓</button>
            </div>
          </div>
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={15} className="pq-contribution-input mt-5 font-mono text-xs leading-6" />
        </section>
      ) : null}
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="pq-contribution-kicker">{children}</span>;
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  id: FieldId;
  label: string;
  value: string;
  onChange: (id: FieldId, value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input
        value={value}
        onChange={(event) => onChange(id, event.target.value)}
        placeholder={placeholder}
        required={required}
        className="pq-contribution-input"
      />
    </label>
  );
}
