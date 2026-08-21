import { NextRequest, NextResponse } from "next/server";
import {
  adminResponseError as responseError,
  authenticateAdmin,
} from "@/lib/adminAuthentication";
import {
  QueerSystemRow,
  readQueerSystemRows,
  serializeQueerSystemRows,
  writeQueerSystemRows,
} from "@/lib/queerSystemDataset";
import {
  PLAYER_DEPENDENCIES,
  QUEER_SYSTEM_SCOPES,
  QUEER_SYSTEM_TYPES,
  SYSTEM_AVAILABILITIES,
  sanitizeQueerSystemRow,
} from "@/lib/queerSystemSchema";
import {
  EVIDENCE_CONFIDENCE_LEVELS,
  RESEARCH_STATUSES,
} from "@/lib/researchMetadataSchema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let mutationQueue: Promise<unknown> = Promise.resolve();

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("en");
}

function parseScopes(value: string) {
  return [
    ...new Set(
      value
        .split(/[;,]/)
        .map((scope) => scope.trim())
        .filter(Boolean),
    ),
  ];
}

function normalizeScopes(value: string) {
  return parseScopes(value).sort().join("; ");
}

function validationError(row: QueerSystemRow) {
  if (!row.game_title) return "Informe o título do jogo.";
  if (!row.system_type) return "Selecione o tipo de sistema.";
  if (!row.system_description) return "Descreva o que o sistema permite.";

  if (row.release_year && !/^\d{4}$/.test(row.release_year)) {
    return "O ano de lançamento deve conter quatro dígitos.";
  }

  if (
    row.research_status &&
    !RESEARCH_STATUSES.includes(
      row.research_status as (typeof RESEARCH_STATUSES)[number],
    )
  ) {
    return "O status da pesquisa informado não é válido.";
  }

  if (
    row.evidence_confidence &&
    !EVIDENCE_CONFIDENCE_LEVELS.includes(
      row.evidence_confidence as (typeof EVIDENCE_CONFIDENCE_LEVELS)[number],
    )
  ) {
    return "O nível de confiança da evidência não é válido.";
  }

  if (row.last_reviewed && !/^\d{4}-\d{2}-\d{2}$/.test(row.last_reviewed)) {
    return "A data da revisão deve usar o formato AAAA-MM-DD.";
  }

  if (
    !QUEER_SYSTEM_TYPES.includes(
      row.system_type as (typeof QUEER_SYSTEM_TYPES)[number],
    )
  ) {
    return "O tipo de sistema informado não é válido.";
  }

  if (
    parseScopes(row.scope).some(
      (scope) =>
        !QUEER_SYSTEM_SCOPES.includes(
          scope as (typeof QUEER_SYSTEM_SCOPES)[number],
        ),
    )
  ) {
    return "O escopo informado não é válido.";
  }

  if (
    row.player_dependency &&
    !PLAYER_DEPENDENCIES.includes(
      row.player_dependency as (typeof PLAYER_DEPENDENCIES)[number],
    )
  ) {
    return "A dependência do jogador informada não é válida.";
  }

  if (
    row.availability &&
    !SYSTEM_AVAILABILITIES.includes(
      row.availability as (typeof SYSTEM_AVAILABILITIES)[number],
    )
  ) {
    return "A disponibilidade informada não é válida.";
  }

  for (const [field, value] of Object.entries(row)) {
    if (value.length > 20_000) {
      return `O campo ${field} ultrapassa o limite de 20.000 caracteres.`;
    }
  }

  return null;
}

function isDuplicate(rows: QueerSystemRow[], candidate: QueerSystemRow) {
  return rows.some(
    (row) =>
      row.system_id !== candidate.system_id &&
      normalize(row.game_title) === normalize(candidate.game_title) &&
      row.system_type === candidate.system_type &&
      normalizeScopes(row.scope) === normalizeScopes(candidate.scope),
  );
}

function nextSystemId(rows: QueerSystemRow[]) {
  const highestId = rows.reduce((highest, row) => {
    const id = Number.parseInt(row.system_id, 10);
    return Number.isNaN(id) ? highest : Math.max(highest, id);
  }, 0);

  return String(highestId + 1);
}

function serializeMutation<T>(operation: () => T | Promise<T>) {
  const result = mutationQueue.then(operation, operation);
  mutationQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function readRequestRows(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      system?: unknown;
      system_types?: unknown;
    };
    const baseRow = sanitizeQueerSystemRow(body.system);
    baseRow.scope = normalizeScopes(baseRow.scope);
    const selectedTypes = Array.isArray(body.system_types)
      ? [
          ...new Set(
            body.system_types.filter(
              (value): value is string =>
                typeof value === "string" && value.trim().length > 0,
            ),
          ),
        ]
      : [];

    if (selectedTypes.length === 0) return [baseRow];

    return selectedTypes.map((systemType) => ({
      ...baseRow,
      system_id: "",
      system_type: systemType,
    }));
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const authenticationError = authenticateAdmin(request);
  if (authenticationError) return authenticationError;

  try {
    const systems = readQueerSystemRows();

    if (request.nextUrl.searchParams.get("format") === "csv") {
      return new NextResponse(serializeQueerSystemRows(systems), {
        headers: {
          "Content-Disposition": 'attachment; filename="game_queer_systems.csv"',
          "Content-Type": "text/csv; charset=utf-8",
        },
      });
    }

    return NextResponse.json({ systems, count: systems.length });
  } catch (error) {
    console.error("Failed reading queer systems dataset:", error);
    return responseError("Não foi possível ler o dataset de sistemas queer.", 500);
  }
}

export async function POST(request: NextRequest) {
  const authenticationError = authenticateAdmin(request);
  if (authenticationError) return authenticationError;

  const incomingRows = await readRequestRows(request);
  if (!incomingRows || incomingRows.length === 0) {
    return responseError("Dados inválidos.", 400);
  }

  try {
    const systems = await serializeMutation(() => {
      const rows = readQueerSystemRows();
      const firstId = Number.parseInt(nextSystemId(rows), 10);
      const createdRows: QueerSystemRow[] = [];

      for (const [index, incomingRow] of incomingRows.entries()) {
        const row = {
          ...incomingRow,
          system_id: String(firstId + index),
        };
        const error = validationError(row);

        if (error) throw new DatasetRequestError(error, 400);
        if (isDuplicate([...rows, ...createdRows], row)) {
          throw new DatasetRequestError(
            `O sistema ${row.system_type} já está cadastrado para o mesmo jogo e escopo.`,
            409,
          );
        }

        createdRows.push(row);
      }

      writeQueerSystemRows([...rows, ...createdRows]);
      return createdRows;
    });

    return NextResponse.json(
      { system: systems[0], systems },
      { status: 201 },
    );
  } catch (error) {
    return handleMutationError(error);
  }
}

export async function PUT(request: NextRequest) {
  const authenticationError = authenticateAdmin(request);
  if (authenticationError) return authenticationError;

  const incomingRows = await readRequestRows(request);
  const incomingRow = incomingRows?.[0];
  if (!incomingRow) return responseError("Dados inválidos.", 400);
  if (!incomingRow.system_id) {
    return responseError("O identificador do sistema é obrigatório.", 400);
  }

  try {
    const system = await serializeMutation(() => {
      const rows = readQueerSystemRows();
      const index = rows.findIndex(
        (row) => row.system_id === incomingRow.system_id,
      );

      if (index < 0) {
        throw new DatasetRequestError("Sistema não encontrado.", 404);
      }

      const error = validationError(incomingRow);
      if (error) throw new DatasetRequestError(error, 400);
      if (isDuplicate(rows, incomingRow)) {
        throw new DatasetRequestError(
          "Esse sistema já está cadastrado para o mesmo jogo e escopo.",
          409,
        );
      }

      const updatedRows = [...rows];
      updatedRows[index] = incomingRow;
      writeQueerSystemRows(updatedRows);
      return incomingRow;
    });

    return NextResponse.json({ system });
  } catch (error) {
    return handleMutationError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const authenticationError = authenticateAdmin(request);
  if (authenticationError) return authenticationError;

  const systemId = request.nextUrl.searchParams.get("id")?.trim();
  if (!systemId) {
    return responseError("Informe o identificador do sistema.", 400);
  }

  try {
    await serializeMutation(() => {
      const rows = readQueerSystemRows();
      const updatedRows = rows.filter((row) => row.system_id !== systemId);

      if (updatedRows.length === rows.length) {
        throw new DatasetRequestError("Sistema não encontrado.", 404);
      }

      writeQueerSystemRows(updatedRows);
    });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    return handleMutationError(error);
  }
}

class DatasetRequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function handleMutationError(error: unknown) {
  if (error instanceof DatasetRequestError) {
    return responseError(error.message, error.status);
  }

  console.error("Failed writing queer systems dataset:", error);
  return responseError(
    "Não foi possível gravar o CSV. Verifique se a hospedagem permite escrita em disco.",
    500,
  );
}
