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
    label: "Título do jogo",
    placeholder: "Ex.: The Sims 4",
    required: true,
  },
  {
    id: "release_year",
    label: "Ano de lançamento",
    placeholder: "2014",
    type: "number",
  },
  {
    id: "system_type",
    label: "Tipo de sistema",
    type: "select",
    required: true,
    options: [
      { label: "Selecione", value: "" },
      { label: "Criação de personagem", value: "character_creation" },
      { label: "Customização de gênero", value: "gender_customization" },
      { label: "Seleção de pronomes", value: "pronoun_selection" },
      {
        label: "Customização de sexualidade",
        value: "sexuality_customization",
      },
      { label: "Romance entre mesmo gênero", value: "same_gender_romance" },
      {
        label: "Romance independente de gênero",
        value: "gender_independent_romance",
      },
      { label: "Casamento entre mesmo gênero", value: "same_gender_marriage" },
      { label: "Criação de família queer", value: "queer_family_creation" },
      { label: "Sistema de relacionamentos", value: "relationship_system" },
      { label: "Outro", value: "other" },
    ],
  },
  {
    id: "scope",
    label: "Escopo",
    type: "multiselect",
    options: [
      { label: "Avatar do jogador", value: "player_avatar" },
      { label: "NPCs", value: "npc" },
      { label: "Relacionamentos", value: "relationships" },
      { label: "Família", value: "family" },
      { label: "Mundo do jogo", value: "world" },
    ],
    help: "Marque todos os níveis afetados pelo mesmo sistema.",
  },
  {
    id: "player_dependency",
    label: "Dependência do jogador",
    type: "select",
    options: [
      { label: "Selecione", value: "" },
      { label: "Nenhuma", value: "none" },
      { label: "Parcial", value: "partial" },
      { label: "Total", value: "full" },
    ],
    help: "Use “total” quando a experiência só existe por escolha do jogador.",
  },
  {
    id: "availability",
    label: "Disponibilidade",
    type: "select",
    options: [
      { label: "Selecione", value: "" },
      { label: "Padrão", value: "default" },
      { label: "Opcional", value: "optional" },
      { label: "Condicional", value: "conditional" },
      { label: "Expansão / DLC", value: "expansion" },
      { label: "Somente por mod", value: "mod_only" },
    ],
  },
  {
    id: "system_description",
    label: "Descrição do sistema",
    placeholder: "Descreva precisamente o que o jogo permite ao jogador.",
    type: "textarea",
    rows: 4,
    required: true,
    wide: true,
  },
  {
    id: "limitations",
    label: "Limitações e condições",
    placeholder: "Restrições de plataforma, DLC, gênero, personagem ou versão.",
    type: "textarea",
    rows: 3,
    wide: true,
  },
  {
    id: "evidence_source",
    label: "Fonte / evidência",
    placeholder: "Documentação oficial, cena, teste do sistema, artigo ou URL.",
    type: "textarea",
    rows: 3,
    wide: true,
  },
  {
    id: "notes",
    label: "Notas curatoriais",
    type: "textarea",
    rows: 3,
    wide: true,
  },
  {
    id: "research_status",
    label: "Status da pesquisa",
    type: "select",
    options: [
      { label: "Selecione", value: "" },
      { label: "Identificado / na fila", value: "identified" },
      { label: "Em pesquisa", value: "in_progress" },
      { label: "Revisado", value: "reviewed" },
      { label: "Precisa de verificação", value: "needs_verification" },
    ],
  },
  {
    id: "evidence_confidence",
    label: "Confiança da evidência",
    type: "select",
    options: [
      { label: "Selecione", value: "" },
      { label: "Baixa", value: "low" },
      { label: "Média", value: "medium" },
      { label: "Alta", value: "high" },
    ],
  },
  {
    id: "source_language",
    label: "Idioma da fonte",
    placeholder: "Ex.: en, pt-BR, ja",
    help: "Registre o idioma para tornar lacunas linguísticas mensuráveis.",
  },
  {
    id: "platform_version",
    label: "Plataforma / versão pesquisada",
    placeholder: "Ex.: PC, patch 1.108 ou expansão específica",
  },
  {
    id: "discovery_source",
    label: "Como o caso foi descoberto",
    placeholder: "Indicação, lista existente, busca própria, comunidade…",
    wide: true,
  },
  {
    id: "last_reviewed",
    label: "Última revisão",
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
          throw new Error(data?.error || "Falha ao carregar os sistemas.");
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
              : "Falha ao carregar os sistemas.",
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
      throw new Error(body?.error || "A operação não pôde ser concluída.");
    }

    return response;
  }

  function canDiscardChanges() {
    return (
      !dirty ||
      window.confirm("Descartar as alterações que ainda não foram salvas?")
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
          text: "Selecione pelo menos um tipo de sistema.",
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
            ? "Sistema queer cadastrado no CSV."
            : `${createdSystems.length} sistemas queer cadastrados em linhas separadas.`
          : "Alterações salvas no CSV.",
      });
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Falha ao salvar.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function deleteSystem() {
    if (!draft.system_id) return;
    if (
      !window.confirm(
        `Excluir o sistema “${systemTypeLabels[draft.system_type] || draft.system_type}” de ${draft.game_title}?`,
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
      setNotice({ kind: "success", text: "Sistema excluído do CSV." });
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Falha ao excluir.",
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
        text: error instanceof Error ? error.message : "Falha no download.",
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
              <p className="pq-eyebrow">Sistemas queer</p>
              <p className="mt-1 text-sm font-bold text-[#646b89]">
                {systems.length} registros
              </p>
            </div>
            <button
              type="button"
              onClick={startNewSystem}
              className="pq-primary-button px-4 py-2.5 text-[10px]"
            >
              + Novo
            </button>
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar jogo ou sistema"
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
                  {system.game_title || "Jogo não informado"}
                </span>
                <span className="mt-1 block text-xs text-[#646b89]">
                  {systemTypeLabels[system.system_type] ||
                    system.system_type ||
                    "Sistema não informado"}
                </span>
              </button>
            );
          })}

          {!busy && filteredSystems.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm leading-relaxed text-[#7b819c]">
              Nenhum sistema cadastrado. Use “+ Novo” para criar a primeira
              entrada.
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
            Baixar backup CSV
          </button>
          <button
            type="button"
            onClick={() => {
              if (canDiscardChanges()) onLogout();
            }}
            className="rounded-full border border-[#dfe3f3] px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#646b89] transition hover:bg-[#f4f5fb]"
          >
            Sair
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
                ? `Sistema #${draft.system_id}`
                : "Novo sistema"}
            </p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              {draft.game_title || "Nova possibilidade queer"}
            </h2>
          </div>
          {dirty ? (
            <span className="w-fit rounded-full bg-[#ffdf70] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#584600]">
              Alterações não salvas
            </span>
          ) : null}
        </div>

        <div className="space-y-8 p-6 sm:p-8 lg:p-10">
          <SystemNotice notice={notice} />

          <section className="rounded-2xl border border-[#dfe3f3] bg-[#f8f9fd] p-4 text-sm leading-relaxed text-[#646b89]">
            No cadastro, você pode selecionar várias possibilidades de uma vez.
            O painel criará uma linha independente para cada uma; depois, cada
            sistema poderá ter evidências e limitações próprias.
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
                Excluir sistema
              </button>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={busy || !dirty}
            className="pq-primary-button px-7 py-4 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Salvando…" : "Salvar no dataset"}
          </button>
        </div>
      </form>

      <p className="text-xs leading-relaxed text-[#7b819c] xl:col-start-2">
        As alterações são gravadas em <code>src/data/game_queer_systems.csv</code>.
        Personagens continuam armazenados separadamente no dataset principal.
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
        Tipos de sistema *
      </legend>
      <p className="mt-1.5 text-xs leading-relaxed text-[#898fa8]">
        Marque todas as possibilidades presentes no jogo. Os demais campos
        serão aplicados inicialmente a todas as linhas criadas.
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
                ? `${selected.length} ${selected.length === 1 ? "escopo selecionado" : "escopos selecionados"}`
                : "Selecione um ou mais escopos"}
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
