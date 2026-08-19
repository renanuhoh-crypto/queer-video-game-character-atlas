import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  CharacterRow,
  readCharacterRows,
  serializeCharacterRows,
  writeCharacterRows,
} from "@/lib/characterDataset";
import { sanitizeCharacterRow } from "@/lib/characterSchema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let mutationQueue: Promise<unknown> = Promise.resolve();

function responseError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function passwordsMatch(received: string, expected: string) {
  const receivedHash = createHash("sha256").update(received).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(receivedHash, expectedHash);
}

function authenticate(request: NextRequest) {
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredPassword) {
    return responseError(
      "A área administrativa ainda não foi configurada. Defina ADMIN_PASSWORD no arquivo .env.local e reinicie o servidor.",
      503,
    );
  }

  const receivedPassword = request.headers.get("x-admin-password") || "";
  if (!passwordsMatch(receivedPassword, configuredPassword)) {
    return responseError("Senha administrativa incorreta.", 401);
  }

  return null;
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("en");
}

function validationError(row: CharacterRow) {
  if (!row.character_name) return "Informe o nome do personagem.";
  if (!row.game_title) return "Informe o título do jogo.";

  if (row.release_year && !/^\d{4}$/.test(row.release_year)) {
    return "O ano de lançamento deve conter quatro dígitos.";
  }

  for (const [field, value] of Object.entries(row)) {
    if (value.length > 20_000) {
      return `O campo ${field} ultrapassa o limite de 20.000 caracteres.`;
    }
  }

  return null;
}

function isDuplicate(rows: CharacterRow[], candidate: CharacterRow) {
  return rows.some(
    (row) =>
      row.character_id !== candidate.character_id &&
      normalize(row.character_name) === normalize(candidate.character_name) &&
      normalize(row.game_title) === normalize(candidate.game_title),
  );
}

function nextCharacterId(rows: CharacterRow[]) {
  const highestId = rows.reduce((highest, row) => {
    const id = Number.parseInt(row.character_id, 10);
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

async function readRequestRow(request: NextRequest) {
  try {
    const body = (await request.json()) as { character?: unknown };
    return sanitizeCharacterRow(body.character);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const authenticationError = authenticate(request);
  if (authenticationError) return authenticationError;

  try {
    const characters = readCharacterRows();

    if (request.nextUrl.searchParams.get("format") === "csv") {
      return new NextResponse(serializeCharacterRows(characters), {
        headers: {
          "Content-Disposition":
            'attachment; filename="pressq_seed_dataset.csv"',
          "Content-Type": "text/csv; charset=utf-8",
        },
      });
    }

    return NextResponse.json({ characters, count: characters.length });
  } catch (error) {
    console.error("Failed reading character dataset:", error);
    return responseError("Não foi possível ler o dataset de personagens.", 500);
  }
}

export async function POST(request: NextRequest) {
  const authenticationError = authenticate(request);
  if (authenticationError) return authenticationError;

  const incomingRow = await readRequestRow(request);
  if (!incomingRow) return responseError("Dados inválidos.", 400);

  try {
    const character = await serializeMutation(() => {
      const rows = readCharacterRows();
      const row = { ...incomingRow, character_id: nextCharacterId(rows) };
      const error = validationError(row);

      if (error) throw new DatasetRequestError(error, 400);
      if (isDuplicate(rows, row)) {
        throw new DatasetRequestError(
          "Esse personagem já está cadastrado para o mesmo jogo.",
          409,
        );
      }

      writeCharacterRows([...rows, row]);
      return row;
    });

    return NextResponse.json({ character }, { status: 201 });
  } catch (error) {
    return handleMutationError(error);
  }
}

export async function PUT(request: NextRequest) {
  const authenticationError = authenticate(request);
  if (authenticationError) return authenticationError;

  const incomingRow = await readRequestRow(request);
  if (!incomingRow) return responseError("Dados inválidos.", 400);
  if (!incomingRow.character_id) {
    return responseError("O identificador do personagem é obrigatório.", 400);
  }

  try {
    const character = await serializeMutation(() => {
      const rows = readCharacterRows();
      const index = rows.findIndex(
        (row) => row.character_id === incomingRow.character_id,
      );

      if (index < 0) {
        throw new DatasetRequestError("Personagem não encontrado.", 404);
      }

      const error = validationError(incomingRow);
      if (error) throw new DatasetRequestError(error, 400);
      if (isDuplicate(rows, incomingRow)) {
        throw new DatasetRequestError(
          "Esse personagem já está cadastrado para o mesmo jogo.",
          409,
        );
      }

      const updatedRows = [...rows];
      updatedRows[index] = incomingRow;
      writeCharacterRows(updatedRows);
      return incomingRow;
    });

    return NextResponse.json({ character });
  } catch (error) {
    return handleMutationError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const authenticationError = authenticate(request);
  if (authenticationError) return authenticationError;

  const characterId = request.nextUrl.searchParams.get("id")?.trim();
  if (!characterId) {
    return responseError("Informe o identificador do personagem.", 400);
  }

  try {
    await serializeMutation(() => {
      const rows = readCharacterRows();
      const updatedRows = rows.filter(
        (row) => row.character_id !== characterId,
      );

      if (updatedRows.length === rows.length) {
        throw new DatasetRequestError("Personagem não encontrado.", 404);
      }

      writeCharacterRows(updatedRows);
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

  console.error("Failed writing character dataset:", error);
  return responseError(
    "Não foi possível gravar o CSV. Verifique se a hospedagem permite escrita em disco.",
    500,
  );
}
