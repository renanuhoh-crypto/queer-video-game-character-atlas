import OpenAI from "openai";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type Character = {
  character_id?: string;
  character_name: string;
  game_title: string;
  release_year?: number | null;
  developer: string;
  game_scale?: string;
  genre?: string;
  narrative_role?: string;
  playable: boolean;
  playable_status?: string;
  identity_category: string[];
  identity_label: string[];
  identity_confirmation?: string;
  queer_status?: string;
  total_score?: number | null;
  queer_joy_score?: number | null;
  intersectionality_present?: string;
  intersectionality_details?: string;
  evidence_type?: string;
  evidence_source?: string;
  notes?: string;
  description: string;
  character_image?: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: Request) {
  try {
    const characters = loadCharactersFromCSV();

    const body = await req.json();
    const messages: ChatMessage[] = body.messages || [];

    const latestUserMessage =
      messages.filter((m) => m.role === "user").at(-1)?.content || "";

    const searchText = normalize(latestUserMessage);

    const conversationContext = messages
      .slice(-8)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const languageInstruction = detectLanguageInstruction(searchText);

    // COUNT / TOTAL CHARACTERS
    if (
      includesAny(searchText, [
        "how many",
        "total",
        "count",
        "quantos",
        "quantas",
        "combien",
        "cuantos",
        "cuántos",
      ]) &&
      includesAny(searchText, [
        "character",
        "characters",
        "personagem",
        "personagens",
        "queer",
        "personajes",
      ])
    ) {
      const datasetContext = `
Total characters registered: ${characters.length}

Characters:
${characters
  .map(
    (c, index) =>
      `${index + 1}. ${c.character_name} — ${c.game_title} — ${formatList(
        c.identity_label
      )}`
  )
  .join("\n")}
`;

      const reply = await developDatasetAnswer(
        languageInstruction,
        datasetContext,
        latestUserMessage,
        conversationContext
      );

      return NextResponse.json({ reply, character: null });
    }

    // LIST ALL CHARACTERS
    if (
      includesAny(searchText, [
        "list",
        "show all",
        "listar",
        "liste",
        "mostre todos",
        "mostrar todos",
      ])
    ) {
      const datasetContext = charactersToContext(characters);

      const reply = await developDatasetAnswer(
        languageInstruction,
        datasetContext,
        latestUserMessage,
        conversationContext
      );

      return NextResponse.json({ reply, character: null });
    }

    // TRANS CHARACTERS
    if (
      includesAny(searchText, [
        "trans",
        "transgender",
        "transgenero",
        "transgênero",
      ])
    ) {
      const transCharacters = characters.filter((c) =>
        c.identity_label.some((label) => normalize(label).includes("trans"))
      );

      const percentage = characters.length
        ? Math.round((transCharacters.length / characters.length) * 100)
        : 0;

      const datasetContext = `
Total characters in dataset: ${characters.length}
Trans characters: ${transCharacters.length}
Percentage trans: ${percentage}%

Trans characters:
${charactersToContext(transCharacters)}
`;

      const reply = await developDatasetAnswer(
        languageInstruction,
        datasetContext,
        latestUserMessage,
        conversationContext
      );

      return NextResponse.json({
        reply,
        character: transCharacters.length === 1 ? transCharacters[0] : null,
      });
    }

    // INTERSECTIONALITY
    if (
      includesAny(searchText, [
        "intersectionality",
        "intersectional",
        "interseccionalidade",
        "interseccional",
        "interseccionais",
        "intersecção",
        "interseção",
      ])
    ) {
      const intersectionalCharacters = characters.filter((c) => {
        const present = normalize(c.intersectionality_present || "");
        const details = normalize(c.intersectionality_details || "");

        return (
          present !== "" &&
          present !== "none" &&
          present !== "no" &&
          details !== ""
        );
      });

      const percentage = characters.length
        ? Math.round(
            (intersectionalCharacters.length / characters.length) * 100
          )
        : 0;

      const datasetContext = `
Total characters in dataset: ${characters.length}
Characters with intersectionality: ${intersectionalCharacters.length}
Percentage with intersectionality: ${percentage}%

Intersectional characters:
${charactersToContext(intersectionalCharacters)}
`;

      const reply = await developDatasetAnswer(
        languageInstruction,
        datasetContext,
        latestUserMessage,
        conversationContext
      );

      return NextResponse.json({
        reply,
        character:
          intersectionalCharacters.length === 1
            ? intersectionalCharacters[0]
            : null,
      });
    }

    // PLAYABLE CHARACTERS
    if (
      includesAny(searchText, [
        "playable",
        "jogavel",
        "jogável",
        "play as",
      ])
    ) {
      const playableCharacters = characters.filter((c) => c.playable);

      const percentage = characters.length
        ? Math.round((playableCharacters.length / characters.length) * 100)
        : 0;

      const datasetContext = `
Total characters in dataset: ${characters.length}
Playable characters: ${playableCharacters.length}
Percentage playable: ${percentage}%

Playable characters:
${charactersToContext(playableCharacters)}
`;

      const reply = await developDatasetAnswer(
        languageInstruction,
        datasetContext,
        latestUserMessage,
        conversationContext
      );

      return NextResponse.json({
        reply,
        character:
          playableCharacters.length === 1 ? playableCharacters[0] : null,
      });
    }

    // PROTAGONISTS
    if (
      includesAny(searchText, [
        "protagonist",
        "protagonists",
        "protagonista",
        "main character",
      ])
    ) {
      const protagonists = characters.filter((c) =>
        normalize(c.narrative_role || "").includes("protagonist")
      );

      const percentage = characters.length
        ? Math.round((protagonists.length / characters.length) * 100)
        : 0;

      const datasetContext = `
Total characters in dataset: ${characters.length}
Protagonists: ${protagonists.length}
Percentage protagonists: ${percentage}%

Protagonists:
${charactersToContext(protagonists)}
`;

      const reply = await developDatasetAnswer(
        languageInstruction,
        datasetContext,
        latestUserMessage,
        conversationContext
      );

      return NextResponse.json({
        reply,
        character: protagonists.length === 1 ? protagonists[0] : null,
      });
    }

    // HIGHEST SCORE
    if (
      includesAny(searchText, [
        "highest score",
        "best score",
        "top score",
        "highest representation",
        "best representation",
        "maior score",
        "melhor score",
      ])
    ) {
      const scored = [...characters]
        .filter((c) => typeof c.total_score === "number")
        .sort((a, b) => (b.total_score || 0) - (a.total_score || 0));

      const datasetContext = `
Characters with registered representation scores:
${charactersToContext(scored.slice(0, 10))}
`;

      const reply = await developDatasetAnswer(
        languageInstruction,
        datasetContext,
        latestUserMessage,
        conversationContext
      );

      return NextResponse.json({ reply, character: null });
    }

    // QUEER JOY
    if (
      includesAny(searchText, [
        "queer joy",
        "joy",
        "alegria queer",
        "alegría queer",
        "joie queer",
      ])
    ) {
      const joyful = [...characters]
        .filter((c) => typeof c.queer_joy_score === "number")
        .sort((a, b) => (b.queer_joy_score || 0) - (a.queer_joy_score || 0));

      const datasetContext = `
Characters with registered queer joy scores:
${charactersToContext(joyful.slice(0, 10))}
`;

      const reply = await developDatasetAnswer(
        languageInstruction,
        datasetContext,
        latestUserMessage,
        conversationContext
      );

      return NextResponse.json({ reply, character: null });
    }

    // REPRESENTATION BY YEAR
    if (
      includesAny(searchText, ["year", "years", "ano", "anos", "timeline"]) &&
      includesAny(searchText, [
        "representation",
        "characters",
        "personagens",
        "queer",
      ])
    ) {
      const byYear = groupByYear(characters);

      const datasetContext = `
Representation by year:
${byYear.map((item) => `${item.year}: ${item.count} character(s)`).join("\n")}
`;

      const reply = await developDatasetAnswer(
        languageInstruction,
        datasetContext,
        latestUserMessage,
        conversationContext
      );

      return NextResponse.json({ reply, character: null });
    }

    // STUDIOS / DEVELOPERS
    if (
      includesAny(searchText, [
        "studio",
        "studios",
        "developer",
        "developers",
        "empresa",
        "estudio",
        "estúdio",
      ]) &&
      includesAny(searchText, ["most", "mais", "ranking", "top"])
    ) {
      const byStudio = groupByStudio(characters);

      const datasetContext = `
Studios with most queer characters:
${byStudio
  .slice(0, 10)
  .map((item, index) => `${index + 1}. ${item.studio}: ${item.count}`)
  .join("\n")}
`;

      const reply = await developDatasetAnswer(
        languageInstruction,
        datasetContext,
        latestUserMessage,
        conversationContext
      );

      return NextResponse.json({ reply, character: null });
    }

    // CHARACTER SEARCH
    const foundCharacter = characters.find((character) =>
      searchText.includes(normalize(character.character_name))
    );

    if (foundCharacter) {
      const datasetContext = characterToContext(foundCharacter);

      const reply = await developDatasetAnswer(
        languageInstruction,
        datasetContext,
        latestUserMessage,
        conversationContext
      );

      return NextResponse.json({
        reply,
        character: foundCharacter,
      });
    }

    // CONTEXTUAL FOLLOW-UP
    const contextualCharacters = findCharactersMentionedInHistory(
      messages,
      characters
    );

    if (
      includesAny(searchText, [
        "these",
        "them",
        "those",
        "esses",
        "essas",
        "eles",
        "elas",
        "esses personagens",
        "essas personagens",
      ]) &&
      contextualCharacters.length > 0
    ) {
      const datasetContext = charactersToContext(contextualCharacters);

      const reply = await developDatasetAnswer(
        languageInstruction,
        datasetContext,
        latestUserMessage,
        conversationContext
      );

      return NextResponse.json({ reply, character: null });
    }

    // FALLBACK DATASET SUMMARY
    const datasetSummary = buildDatasetSummary(characters);

    const reply = await developDatasetAnswer(
      languageInstruction,
      datasetSummary,
      latestUserMessage,
      conversationContext
    );

    return NextResponse.json({
      reply,
      character: null,
    });
  } catch (error) {
    console.error("API CHAT ERROR:", error);

    return NextResponse.json(
      {
        reply: "Error connecting to Atlas AI.",
        character: null,
      },
      { status: 500 }
    );
  }
}

async function developDatasetAnswer(
  languageInstruction: string,
  datasetContext: string,
  userQuestion: string,
  conversationContext: string
) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.15,
    messages: [
      {
        role: "system",
        content: `
You are Atlas, an AI-assisted archive for queer video game characters.

You may write in natural, developed language, but you must use ONLY the facts explicitly present in the dataset context.

Rules:
- Do not invent information.
- Do not infer race, ethnicity, religion, disability, nationality, sexuality, gender identity, or representation quality unless explicitly written in the dataset context.
- NEVER infer missing statistics.
- NEVER say data is unavailable if it exists in the dataset context.
- Use exact numbers provided in the dataset context.
- Do not invent social interpretation.
- Only describe intersectionality if explicitly present in the spreadsheet fields.
- You may explain relationships between dataset fields, but only when both fields are present.
- You may format technical values into readable language. For example, "trans_man" can become "Trans Man".
- Preserve character names, game titles, numbers, scores, and evidence details.
- If something is missing, say it is not currently registered in the dataset.
- Avoid raw database style, but stay grounded in the provided fields.
- No markdown bullets using asterisks.
${languageInstruction}
`,
      },
      {
        role: "user",
        content: `
Conversation history:
${conversationContext}

Latest user question:
${userQuestion}

Dataset context:
${datasetContext}
`,
      },
    ],
  });

  return completion.choices[0].message.content || "No response.";
}

function loadCharactersFromCSV(): Character[] {
  const filePath = path.join(process.cwd(), "src/data/atlas_seed_dataset.csv");
  const csv = fs.readFileSync(filePath, "utf8");

  const lines = csv.trim().split(/\r?\n/);
  const headers = splitCSVLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = splitCSVLine(line);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || "";
    });

    return {
      character_id: row.character_id,
      character_name: row.character_name,
      game_title: row.game_title,
      release_year: toNumber(row.release_year),
      developer: row.developer,
      game_scale: row.game_scale,
      genre: row.genre,
      narrative_role: row.narrative_role,
      playable: row.playable_status === "playable",
      playable_status: row.playable_status,
      identity_category: toArray(row.identity_category),
      identity_label: toArray(row.identity_label),
      identity_confirmation: row.identity_confirmation,
      queer_status: row.queer_status,
      total_score: toNumber(row.total_score),
      queer_joy_score: toNumber(row.queer_joy_score),
      intersectionality_present: row.intersectionality_present,
      intersectionality_details: row.intersectionality_details,
      evidence_type: row.evidence_type,
      evidence_source: row.evidence_source,
      notes: row.notes,
      description: row.notes || row.evidence_source || "",
      character_image: row.character_image || "",
    };
  });
}

function characterToContext(c: Character) {
  return `
Character Name: ${c.character_name}
Game Title: ${c.game_title}
Release Year: ${c.release_year ?? "Not registered"}
Developer: ${c.developer}
Game Scale: ${formatLabel(c.game_scale || "Not registered")}
Genre: ${c.genre || "Not registered"}
Narrative Role: ${formatLabel(c.narrative_role || "Not registered")}
Playable Status: ${formatLabel(c.playable_status || "Not registered")}
Identity Category: ${formatList(c.identity_category)}
Identity Label: ${formatList(c.identity_label)}
Identity Confirmation: ${formatLabel(c.identity_confirmation || "Not registered")}
Queer Status: ${formatLabel(c.queer_status || "Not registered")}
Total Score: ${c.total_score ?? "Not registered"}
Queer Joy Score: ${c.queer_joy_score ?? "Not registered"}
Intersectionality Present: ${formatLabel(c.intersectionality_present || "Not registered")}
Intersectionality Details: ${c.intersectionality_details || "Not registered"}
Evidence Type: ${formatLabel(c.evidence_type || "Not registered")}
Evidence Source: ${c.evidence_source || "Not registered"}
Notes: ${c.notes || "Not registered"}
Description: ${c.description || "Not registered"}
`;
}

function charactersToContext(list: Character[]) {
  if (list.length === 0) {
    return "No matching characters are currently registered in the dataset.";
  }

  return list.map(characterToContext).join("\n---\n");
}

function buildDatasetSummary(data: Character[]) {
  const total = data.length;

  const trans = data.filter((c) =>
    c.identity_label.some((label) => normalize(label).includes("trans"))
  ).length;

  const playable = data.filter((c) => c.playable).length;

  const intersectional = data.filter((c) => {
    const present = normalize(c.intersectionality_present || "");
    const details = normalize(c.intersectionality_details || "");

    return (
      present !== "" &&
      present !== "none" &&
      present !== "no" &&
      details !== ""
    );
  }).length;

  const protagonists = data.filter((c) =>
    normalize(c.narrative_role || "").includes("protagonist")
  ).length;

  return `
Total characters: ${total}
Trans characters: ${trans}
Playable characters: ${playable}
Queer protagonists: ${protagonists}
Characters with intersectionality information: ${intersectional}
Registered characters: ${data.map((c) => c.character_name).join(", ")}
`;
}

function findCharactersMentionedInHistory(
  messages: ChatMessage[],
  characters: Character[]
) {
  const previousMessages = messages
    .slice(0, -1)
    .slice(-8)
    .map((m) => normalize(m.content))
    .join(" ");

  return characters.filter((character) =>
    previousMessages.includes(normalize(character.character_name))
  );
}

function groupByYear(data: Character[]) {
  const grouped: Record<string, number> = {};

  data.forEach((character) => {
    const year = character.release_year
      ? String(character.release_year)
      : "Unknown";

    grouped[year] = (grouped[year] || 0) + 1;
  });

  return Object.entries(grouped)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => {
      if (a.year === "Unknown") return 1;
      if (b.year === "Unknown") return -1;
      return Number(a.year) - Number(b.year);
    });
}

function groupByStudio(data: Character[]) {
  const grouped: Record<string, number> = {};

  data.forEach((character) => {
    const studio = character.developer || "Unknown";
    grouped[studio] = (grouped[studio] || 0) + 1;
  });

  return Object.entries(grouped)
    .map(([studio, count]) => ({ studio, count }))
    .sort((a, b) => b.count - a.count);
}

function splitCSVLine(line: string) {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (const char of line) {
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function toArray(value: string) {
  if (!value) return [];

  return value
    .split(";")
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNumber(value: string) {
  if (!value) return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

function normalize(value: string) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(normalize(term)));
}

function formatLabel(value: string) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/;/g, ", ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatList(values: string[]) {
  if (!values || values.length === 0) return "Not registered";
  return values.map(formatLabel).join(", ");
}

function detectLanguageInstruction(searchText: string) {
  if (
    includesAny(searchText, [
      "portugues",
      "português",
      "brasil",
      "quantos",
      "quantas",
      "personagens",
      "interseccional",
      "interseccionalidade",
      "intersecção",
      "interseção",
      "jogavel",
      "jogável",
      "porcentagem",
      "percentual",
    ])
  ) {
    return "Respond in Brazilian Portuguese.";
  }

  if (
    includesAny(searchText, [
      "espanol",
      "español",
      "cuantos",
      "cuántos",
      "personajes",
      "representacion",
      "representación",
    ])
  ) {
    return "Respond in Spanish.";
  }

  if (
    includesAny(searchText, [
      "francais",
      "français",
      "combien",
      "personnages",
      "représentation",
    ])
  ) {
    return "Respond in French.";
  }

  return "Respond in English.";
}