"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  QueerSystemColumn,
  QueerSystemRow,
  createEmptyQueerSystemRow,
} from "@/lib/queerSystemSchema";

type Notice = { kind: "success" | "error"; text: string } | null;

type Field = {
  id: QueerSystemColumn;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?:
    | "text"
    | "number"
    | "date"
    | "textarea"
    | "select"
    | "multiselect";
  options?: { label: string; value: string }[];
  wide?: boolean;
  rows?: number;
  help?: string;
};

const fields: Field[] = [
  {
    id: "game_title",
    label: "Game title",
    placeholder: "e.g., The Sims 4",
    required: true,
  },
  {
    id: "release_year",
    label: "Release year",
    placeholder: "2014",
    type: "number",
  },
  {
    id: "system_type",
    label: "System type",
    type: "select",
    required: true,
    options: [
      { label: "Select", value: "" },
      { label: "Character creation", value: "character_creation" },
      { label: "Gender customization", value: "gender_customization" },
      { label: "Pronoun selection", value: "pronoun_selection" },
      {
        label: "Sexuality customization",
        value: "sexuality_customization",
      },
      { label: "Same-gender romance", value: "same_gender_romance" },
      {
        label: "Gender-independent romance",
        value: "gender_independent_romance",
      },
      { label: "Same-gender marriage", value: "same_gender_marriage" },
      { label: "Queer family creation", value: "queer_family_creation" },
      { label: "Relationship system", value: "relationship_system" },
      { label: "Other", value: "other" },
    ],
  },
  {
    id: "scope",
    label: "Scope",
    type: "multiselect",
    options: [
      { label: "Player avatar", value: "player_avatar" },
      { label: "NPCs", value: "npc" },
      { label: "Relationships", value: "relationships" },
      { label: "Family", value: "family" },
      { label: "Game world", value: "world" },
    ],
    help: "Select every level affected by the same system.",
  },
  {
    id: "player_dependency",
    label: "Player dependency",
    type: "select",
    options: [
      { label: "Select", value: "" },
      { label: "None", value: "none" },
      { label: "Partial", value: "partial" },
      { label: "Full", value: "full" },
    ],
    help: "Use “full” when the experience exists only through a player choice.",
  },
  {
    id: "availability",
    label: "Availability",
    type: "select",
    options: [
      { label: "Select", value: "" },
      { label: "Default", value: "default" },
      { label: "Optional", value: "optional" },
      { label: "Conditional", value: "conditional" },
      { label: "Expansion / DLC", value: "expansion" },
      { label: "Mods only", value: "mod_only" },
    ],
  },
  {
    id: "system_description",
    label: "System description",
    placeholder: "Describe precisely what the game allows the player to do.",
    type: "textarea",
    rows: 4,
    required: true,
    wide: true,
  },
  {
    id: "limitations",
    label: "Limitations and conditions",
    placeholder: "Platform, DLC, gender, character, or version restrictions.",
    type: "textarea",
    rows: 3,
    wide: true,
  },
  {
    id: "evidence_source",
    label: "Source / evidence",
    placeholder: "Official documentation, scene, system test, article, or URL.",
    type: "textarea",
    rows: 3,
    wide: true,
  },
  {
    id: "notes",
    label: "Curatorial notes",
    type: "textarea",
    rows: 3,
    wide: true,
  },
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
    id: "source_language",
    label: "Source language",
    placeholder: "e.g., en, pt-BR, ja",
    help: "Record the language to make language gaps measurable.",
  },
  {
    id: "platform_version",
    label: "Platform / version researched",
    placeholder: "e.g., PC, patch 1.108, or specific expansion",
  },
  {
    id: "discovery_source",
    label: "How the case was discovered",
    placeholder: "Referral, existing list, independent search, community…",
    wide: true,
  },
  {
    id: "last_reviewed",
    label: "Last reviewed",
    type: "date",
  },
];

const systemTypeOptions =
  fields
    .find((field) => field.id === "system_type")
    ?.options?.filter((option) => option.value) || [];

const systemTypeLabels = Object.fromEntries(
  systemTypeOptions.map((option) => [option.value, option.label]),
);

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function AdminQueerSystemsManager({
  password,
  onDirtyChange,
  onCountChange,
  onLogout,
}: {
  password: string;
  onDirtyChange: (dirty: boolean) => void;
  onCountChange: (count: number) => void;
  onLogout: () => void;
}) {
  const [systems, setSystems] = useState<QueerSystemRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<QueerSystemRow>(
    createEmptyQueerSystemRow,
  );
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);
  const [selectedSystemTypes, setSelectedSystemTypes] = useState<string[]>([]);

  const selectedSystem = useMemo(
    () => systems.find((system) => system.system_id === selectedId) || null,
    [systems, selectedId],
  );

  const dirty = useMemo(() => {
    const original = selectedSystem || createEmptyQueerSystemRow();
    const recordChanged = JSON.stringify(draft) !== JSON.stringify(original);
    const multipleSelectionChanged =
      !draft.system_id && selectedSystemTypes.length > 0;
    return recordChanged || multipleSelectionChanged;
  }, [draft, selectedSystem, selectedSystemTypes]);

  const filteredSystems = useMemo(() => {
    const query = normalize(search.trim());
    if (!query) return systems;

    return systems.filter((system) =>
      normalize(
        `${system.game_title} ${system.system_type} ${system.system_description}`,
      ).includes(query),
    );
  }, [search, systems]);

  useEffect(() => {
    let active = true;

    async function loadSystems() {
      try {
        const response = await fetch("/api/admin/systems", {
          cache: "no-store",
          headers: { "x-admin-password": password },
        });
        const data = (await response.json().catch(() => null)) as {
          systems?: QueerSystemRow[];
          error?: string;
        } | null;

        if (!response.ok) {
          throw new Error(data?.error || "Could not load systems.");
        }
        if (!active) return;

        const loadedSystems = data?.systems || [];
        setSystems(loadedSystems);
        onCountChange(loadedSystems.length);

        if (loadedSystems[0]) {
          setSelectedId(loadedSystems[0].system_id);
          setDraft(loadedSystems[0]);
          setSelectedSystemTypes([loadedSystems[0].system_type]);
        }
      } catch (error) {
        if (!active) return;
        setNotice({
          kind: "error",
          text:
            error instanceof Error
              ? error.message
              : "Could not load systems.",
        });
      } finally {
        if (active) setBusy(false);
      }
    }

    loadSystems();
    return () => {
      active = false;
    };
  }, [onCountChange, password]);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      if (dirty) event.preventDefault();
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
      throw new Error(body?.error || "The operation could not be completed.");
    }

    return response;
  }

  function canDiscardChanges() {
    return (
      !dirty ||
      window.confirm("Discard the unsaved changes?")
    );
  }

  function selectSystem(system: QueerSystemRow) {
    if (!canDiscardChanges()) return;
    setSelectedId(system.system_id);
    setDraft(system);
    setSelectedSystemTypes([system.system_type]);
    setNotice(null);
  }

  function startNewSystem() {
    if (!canDiscardChanges()) return;
    setSelectedId(null);
    setDraft(createEmptyQueerSystemRow());
    setSelectedSystemTypes([]);
    setNotice(null);
  }

  function updateField(id: QueerSystemColumn, value: string) {
    setDraft((current) => ({ ...current, [id]: value }));
    if (id === "system_type") {
      setSelectedSystemTypes(value ? [value] : []);
    }
    setNotice(null);
  }

  function toggleSystemType(systemType: string) {
    setSelectedSystemTypes((current) =>
      current.includes(systemType)
        ? current.filter((value) => value !== systemType)
        : [...current, systemType],
    );
    setNotice(null);
  }

  async function saveSystem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);

    try {
      const isNew = !draft.system_id;
      if (isNew && selectedSystemTypes.length === 0) {
        setNotice({
          kind: "error",
          text: "Select at least one system type.",
        });
        setBusy(false);
        return;
      }

      const response = await adminRequest("/api/admin/systems", {
        method: isNew ? "POST" : "PUT",
        body: JSON.stringify({
          system: draft,
          system_types: isNew ? selectedSystemTypes : undefined,
        }),
      });
      const data = (await response.json()) as {
        system: QueerSystemRow;
        systems?: QueerSystemRow[];
      };
      const createdSystems = data.systems || [data.system];

      const updatedSystems = isNew
        ? [...systems, ...createdSystems]
        : systems.map((system) =>
            system.system_id === data.system.system_id ? data.system : system,
          );

      setSystems(updatedSystems);
      onCountChange(updatedSystems.length);
      setSelectedId(data.system.system_id);
      setDraft(data.system);
      setSelectedSystemTypes([data.system.system_type]);
      setNotice({
        kind: "success",
        text: isNew
          ? createdSystems.length === 1
            ? "Queer system added to the CSV."
            : `${createdSystems.length} queer systems added as separate rows.`
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

  async function deleteSystem() {
    if (!draft.system_id) return;
    if (
      !window.confirm(
        `Delete the “${systemTypeLabels[draft.system_type] || draft.system_type}” system from ${draft.game_title}?`,
      )
    ) {
      return;
    }

    setBusy(true);
    setNotice(null);

    try {
      await adminRequest(
        `/api/admin/systems?id=${encodeURIComponent(draft.system_id)}`,
        { method: "DELETE" },
      );
      const remaining = systems.filter(
        (system) => system.system_id !== draft.system_id,
      );
      setSystems(remaining);
      onCountChange(remaining.length);
      setSelectedId(remaining[0]?.system_id || null);
      setDraft(remaining[0] || createEmptyQueerSystemRow());
      setSelectedSystemTypes(
        remaining[0]?.system_type ? [remaining[0].system_type] : [],
      );
      setNotice({ kind: "success", text: "System deleted from the CSV." });
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
      const response = await adminRequest("/api/admin/systems?format=csv");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "game_queer_systems.csv";
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

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="h-fit overflow-hidden rounded-[1.8rem] border border-[#dfe3f3] bg-white shadow-[0_18px_48px_rgba(49,63,145,0.1)] xl:sticky xl:top-6">
        <div className="border-b border-[#e5e8f5] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="pq-eyebrow">Queer systems</p>
              <p className="mt-1 text-sm font-bold text-[#646b89]">
                {systems.length} records
              </p>
            </div>
            <button
              type="button"
              onClick={startNewSystem}
              className="pq-primary-button px-4 py-2.5 text-[10px]"
            >
              + New
            </button>
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search game or system"
            className="mt-4 w-full rounded-2xl border border-[#d3d8ed] bg-[#f8f9fd] px-4 py-3 text-sm outline-none transition placeholder:text-[#9da3b9] focus:border-[#4f5fe7]"
          />
        </div>

        <div className="max-h-[55vh] space-y-2 overflow-y-auto p-3 xl:max-h-[calc(100vh-270px)]">
          {filteredSystems.map((system) => {
            const selected = system.system_id === selectedId;
            return (
              <button
                key={system.system_id}
                type="button"
                onClick={() => selectSystem(system)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  selected
                    ? "border-[#4f5fe7] bg-[#eef0ff] shadow-sm"
                    : "border-transparent hover:border-[#dfe3f3] hover:bg-[#f8f9fd]"
                }`}
              >
                <span className="block font-black text-[#12152b]">
                  {system.game_title || "Game not provided"}
                </span>
                <span className="mt-1 block text-xs text-[#646b89]">
                  {systemTypeLabels[system.system_type] ||
                    system.system_type ||
                    "System not provided"}
                </span>
              </button>
            );
          })}

          {!busy && filteredSystems.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm leading-relaxed text-[#7b819c]">
              No systems have been added. Use “+ New” to create the first
              entry.
            </p>
          ) : null}
        </div>

        <div className="grid gap-2 border-t border-[#e5e8f5] p-4">
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
            onClick={() => {
              if (canDiscardChanges()) onLogout();
            }}
            className="rounded-full border border-[#dfe3f3] px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#646b89] transition hover:bg-[#f4f5fb]"
          >
            Sign out
          </button>
        </div>
      </aside>

      <form
        onSubmit={saveSystem}
        className="overflow-hidden rounded-[1.8rem] border border-[#dfe3f3] bg-white shadow-[0_18px_48px_rgba(49,63,145,0.1)]"
      >
        <div className="flex flex-col gap-4 border-b border-[#e5e8f5] bg-[#171d52] p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.22em] text-[#9be8f5]">
              {draft.system_id
                ? `System #${draft.system_id}`
                : "New system"}
            </p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              {draft.game_title || "New queer possibility"}
            </h2>
          </div>
          {dirty ? (
            <span className="w-fit rounded-full bg-[#ffdf70] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#584600]">
              Unsaved changes
            </span>
          ) : null}
        </div>

        <div className="space-y-8 p-6 sm:p-8 lg:p-10">
          <SystemNotice notice={notice} />

          <section className="rounded-2xl border border-[#dfe3f3] bg-[#f8f9fd] p-4 text-sm leading-relaxed text-[#646b89]">
            When adding a record, you can select several possibilities at once.
            The panel will create a separate row for each one; afterward, each
            system can have its own evidence and limitations.
          </section>

          <div className="grid gap-5 md:grid-cols-2">
            {fields.map((field) =>
              field.id === "system_type" && !draft.system_id ? (
                <SystemTypeMultiSelect
                  key={field.id}
                  selected={selectedSystemTypes}
                  onToggle={toggleSystemType}
                />
              ) : (
                <SystemField
                  key={field.id}
                  field={field}
                  value={draft[field.id]}
                  onChange={(value) => updateField(field.id, value)}
                />
              ),
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#e5e8f5] bg-[#f8f9fd] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            {draft.system_id ? (
              <button
                type="button"
                onClick={deleteSystem}
                disabled={busy}
                className="rounded-full border border-[#f0b6c7] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#b72755] transition hover:bg-[#fff0f5] disabled:opacity-50"
              >
                Delete system
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
        Changes are written to <code>src/data/game_queer_systems.csv</code>.
        Characters remain stored separately in the primary dataset.
      </p>
    </div>
  );
}

function SystemTypeMultiSelect({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset className="md:col-span-2">
      <legend className="font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#4f5fe7]">
        System types *
      </legend>
      <p className="mt-1.5 text-xs leading-relaxed text-[#898fa8]">
        Select every possibility present in the game. The remaining fields will
        initially apply to every created row.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {systemTypeOptions.map((option) => {
          const checked = selected.includes(option.value);

          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                checked
                  ? "border-[#4f5fe7] bg-[#eef0ff] text-[#2636b5] shadow-sm"
                  : "border-[#d3d8ed] bg-white text-[#515873] hover:border-[#9ba5ed]"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(option.value)}
                className="h-4 w-4 accent-[#4f5fe7]"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function SystemField({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.type === "multiselect") {
    const selected = value
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean);

    function toggle(optionValue: string) {
      const next = selected.includes(optionValue)
        ? selected.filter((item) => item !== optionValue)
        : [...selected, optionValue];
      onChange(next.join("; "));
    }

    return (
      <div className={field.wide ? "md:col-span-2" : undefined}>
        <span className="font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#4f5fe7]">
          {field.label}
          {field.required ? " *" : ""}
        </span>
        <details className="pq-multi-select group mt-2 rounded-2xl border border-[#d3d8ed] bg-white open:border-[#4f5fe7] open:ring-4 open:ring-[#4f5fe7]/10">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm marker:hidden">
            <span className={selected.length ? "font-bold text-[#12152b]" : "text-[#9da3b9]"}>
              {selected.length
                ? `${selected.length} ${selected.length === 1 ? "scope selected" : "scopes selected"}`
                : "Select one or more scopes"}
            </span>
            <span className="text-[#4f5fe7] transition group-open:rotate-180" aria-hidden="true">
              ▾
            </span>
          </summary>
          <div className="grid gap-2 border-t border-[#e5e8f5] p-3">
            {field.options?.map((option) => {
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
          </div>
        </details>
        {field.help ? (
          <span className="mt-1.5 block text-xs leading-relaxed text-[#898fa8]">
            {field.help}
          </span>
        ) : null}
      </div>
    );
  }

  const baseClass =
    "mt-2 w-full rounded-2xl border border-[#d3d8ed] bg-white px-4 py-3 text-sm text-[#12152b] outline-none transition placeholder:text-[#9da3b9] focus:border-[#4f5fe7] focus:ring-4 focus:ring-[#4f5fe7]/10";

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

function SystemNotice({ notice }: { notice: Notice }) {
  if (!notice) return null;

  return (
    <p
      role="status"
      className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
        notice.kind === "success"
          ? "border-[#a7dfd2] bg-[#effbf8] text-[#176755]"
          : "border-[#f0b6c7] bg-[#fff0f5] text-[#a51f4b]"
      }`}
    >
      {notice.text}
    </p>
  );
}
