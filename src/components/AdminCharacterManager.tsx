"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CharacterColumn,
  CharacterRow,
  createEmptyCharacterRow,
} from "@/lib/characterSchema";

type Field = {
  id: CharacterColumn;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "number" | "url" | "textarea" | "select";
  options?: { label: string; value: string }[];
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
    title: "Dados principais",
    description: "Informações básicas para identificar o registro.",
    fields: [
      {
        id: "character_name",
        label: "Nome do personagem",
        placeholder: "Ex.: Ellie",
        required: true,
      },
      {
        id: "game_title",
        label: "Título do jogo",
        placeholder: "Ex.: The Last of Us Part II",
        required: true,
      },
      {
        id: "release_year",
        label: "Ano de lançamento",
        placeholder: "2020",
        type: "number",
      },
      { id: "developer", label: "Desenvolvedora" },
      { id: "publisher", label: "Publicadora" },
      {
        id: "game_scale",
        label: "Escala do jogo",
        placeholder: "AAA, AA ou Indie",
      },
      {
        id: "genre",
        label: "Gênero do jogo",
        placeholder: "Separe múltiplos valores com ;",
      },
      {
        id: "narrative_role",
        label: "Papel narrativo",
        type: "select",
        options: [
          { label: "Selecione", value: "" },
          { label: "Protagonista", value: "protagonist" },
          { label: "Deuteragonista", value: "deuteragonist" },
          { label: "Coadjuvante", value: "supporting_character" },
          { label: "Antagonista", value: "antagonist" },
          { label: "Não definido", value: "none" },
        ],
      },
    ],
  },
  {
    title: "Representação",
    description: "Identidade, confirmação e participação no jogo.",
    fields: [
      {
        id: "playable_status",
        label: "Jogabilidade",
        type: "select",
        options: [
          { label: "Selecione", value: "" },
          { label: "Jogável", value: "playable" },
          { label: "Não jogável", value: "non_playable" },
          { label: "Opcional", value: "optional" },
          { label: "Desconhecido", value: "unknown" },
        ],
      },
      {
        id: "gender",
        label: "Gênero / identidade de gênero",
        placeholder: "Ex.: female, trans_man, Non-binary",
      },
      {
        id: "sexuality",
        label: "Sexualidade",
        placeholder: "Ex.: lesbian, gay, bisexual",
      },
      {
        id: "identity_category",
        label: "Categorias de identidade",
        placeholder: "gender_identity; sexual_orientation",
        help: "Separe múltiplos valores com ponto e vírgula.",
      },
      {
        id: "identity_confirmation",
        label: "Confirmação da identidade",
        type: "select",
        options: [
          { label: "Selecione", value: "" },
          { label: "Explícita no jogo", value: "explicit_in_game" },
          {
            label: "Não explícita no jogo",
            value: "not_explicit_in_game",
          },
          { label: "Confirmada pela equipe", value: "developer_confirmed" },
          { label: "Fonte externa", value: "external_source" },
          { label: "Ambígua", value: "ambiguous" },
        ],
      },
      {
        id: "queer_status",
        label: "Status queer",
        type: "select",
        options: [
          { label: "Selecione", value: "" },
          { label: "Confirmado", value: "confirmed" },
          { label: "Não confirmado", value: "not confirmed" },
          { label: "Ambíguo", value: "ambiguous" },
        ],
      },
    ],
  },
  {
    title: "Interseccionalidade e evidências",
    description: "Contexto necessário para sustentar e interpretar a entrada.",
    fields: [
      {
        id: "intersectionality_present",
        label: "Marcadores interseccionais",
        placeholder: "Race; Ethnicity; Disability; Religion",
        wide: true,
        help: "Use “no” quando nenhum marcador estiver documentado.",
      },
      {
        id: "intersectionality_details",
        label: "Detalhes de interseccionalidade",
        type: "textarea",
        rows: 3,
        wide: true,
      },
      {
        id: "evidence_source",
        label: "Fonte / evidência",
        placeholder: "Cena, diálogo, biografia oficial, artigo ou URL",
        type: "textarea",
        rows: 4,
        wide: true,
      },
      {
        id: "notes",
        label: "Notas curatoriais",
        type: "textarea",
        rows: 4,
        wide: true,
      },
    ],
  },
  {
    title: "Imagem",
    description: "Arquivo usado no site e informações de atribuição.",
    fields: [
      {
        id: "character_image",
        label: "Caminho da imagem",
        placeholder: "/images/ellie.jpg",
        wide: true,
      },
      { id: "image_credit", label: "Crédito da imagem", wide: true },
      {
        id: "image_source_url",
        label: "URL da fonte da imagem",
        placeholder: "https://…",
        type: "url",
        wide: true,
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
      throw ApiError(body?.error || "A operação não pôde ser concluída.");
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
        text: error instanceof Error ? error.message : "Falha ao entrar.",
      });
    } finally {
      setBusy(false);
    }
  }

  function canDiscardChanges() {
    return (
      !dirty ||
      window.confirm("Descartar as alterações que ainda não foram salvas?")
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
          ? "Personagem cadastrado e CSV atualizado."
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

  async function deleteCharacter() {
    if (!draft.character_id) return;
    if (
      !window.confirm(
        `Excluir ${draft.character_name || "este personagem"} permanentemente do CSV?`,
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
      setNotice({ kind: "success", text: "Personagem excluído do CSV." });
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
        text: error instanceof Error ? error.message : "Falha no download.",
      });
    } finally {
      setBusy(false);
    }
  }

  if (!authenticated) {
    return (
      <section className="mx-auto max-w-xl overflow-hidden rounded-[2rem] border border-[#dfe3f3] bg-white p-7 shadow-[0_24px_70px_rgba(49,63,145,0.12)] sm:p-10">
        <p className="pq-eyebrow">Acesso restrito</p>
        <h2 className="mt-3 text-2xl font-black text-[#12152b]">
          Entre com a senha administrativa
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#646b89]">
          A senha é validada somente pelo servidor e não fica salva no
          navegador.
        </p>

        <form onSubmit={login} className="mt-7 space-y-4">
          <label className="block">
            <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#4f5fe7]">
              Senha
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
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <NoticeBanner notice={notice} />
      </section>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="h-fit overflow-hidden rounded-[1.8rem] border border-[#dfe3f3] bg-white shadow-[0_18px_48px_rgba(49,63,145,0.1)] xl:sticky xl:top-6">
        <div className="border-b border-[#e5e8f5] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="pq-eyebrow">Personagens</p>
              <p className="mt-1 text-sm font-bold text-[#646b89]">
                {characters.length} registros
              </p>
            </div>
            <button
              type="button"
              onClick={startNewCharacter}
              className="pq-primary-button px-4 py-2.5 text-[10px]"
            >
              + Novo
            </button>
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar personagem ou jogo"
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
                  {character.character_name || "Sem nome"}
                </span>
                <span className="mt-1 block text-xs text-[#646b89]">
                  {character.game_title || "Jogo não informado"}
                </span>
              </button>
            );
          })}

          {filteredCharacters.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[#7b819c]">
              Nenhum registro encontrado.
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
            Baixar backup CSV
          </button>
          <button
            type="button"
            onClick={() => {
              if (!canDiscardChanges()) return;
              setAuthenticated(false);
              setPassword("");
              setNotice(null);
            }}
            className="rounded-full border border-[#dfe3f3] px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#646b89] transition hover:bg-[#f4f5fb]"
          >
            Sair
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
                ? `Registro #${draft.character_id}`
                : "Novo registro"}
            </p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              {draft.character_name || "Novo personagem"}
            </h2>
          </div>
          {dirty ? (
            <span className="w-fit rounded-full bg-[#ffdf70] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#584600]">
              Alterações não salvas
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
                    field={field}
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
                Excluir personagem
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
        As alterações são gravadas em <code>src/data/pressq_seed_dataset.csv</code>.
        Hospedagens serverless normalmente não oferecem disco persistente; para
        uso administrativo em produção, o próximo passo é conectar um banco de
        dados.
      </p>
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
            <option value={value}>{value} (valor atual)</option>
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
