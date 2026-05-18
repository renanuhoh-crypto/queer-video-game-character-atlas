import OpenAI from "openai";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type Character = {
  character_id: string;
  character_name: string;
  game_title: string;
  release_year?: number | null;
  developer?: string;
  game_scale?: string;
  genre?: string;
  narrative_role?: string;

  playable: boolean;
  playable_status?: string;

  identity_label?: string[];
  identity_category?: string[];

  identity_confirmation?: string;
  queer_status?: string;

  total_score?: number | null;
  queer_joy_score?: number | null;

  intersectionality_present?: string;
  intersectionality_details?: string;

  evidence_type?: string;
  evidence_source?: string;

  notes?: string;
  description?: string;

  character_image?: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

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

function formatLabel(value: string) {
  const formatted = value
    .replace(/_/g, " ")
    .trim()
    .toLowerCase();

  const aliases: Record<string, string> = {
    sexual_orientation: "Sexual Orientation",
    gender_identity: "Gender Identity",
    trans_man: "Trans Man",
    trans_woman: "Trans Woman",
    non_binary: "Non-Binary",
  };

  return (
    aliases[formatted] ||
    formatted.replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function loadCharactersFromCSV(): Character[] {
  const filePath = path.join(
    process.cwd(),
    "src/data/atlas_seed_dataset.csv"
  );

  const csv = fs.readFileSync(filePath, "utf8");

  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) =>
      header.replace(/^\uFEFF/, "").trim(),
  });

  return parsed.data.map((row) => ({
    character_id: row.character_id,

    character_name: row.character_name,

    game_title: row.game_title,

    release_year: toNumber(row.release_year),

    developer: row.developer,

    game_scale: row.game_scale,

    genre: row.genre,

    narrative_role: row.narrative_role,

    playable:
      normalize(row.playable_status) === "playable",

    playable_status: row.playable_status,

    identity_label: [
  row.gender,
  row.sexuality,
].filter(Boolean),

identity_category: toArray(row.identity_category),

    identity_confirmation: row.identity_confirmation,

    queer_status: row.queer_status,

    total_score: toNumber(row.total_score),

    queer_joy_score: toNumber(row.queer_joy_score),

    intersectionality_present:
  row.identity_category?.includes(";") ||
  row.identity_category?.includes(",")
    ? "yes"
    : "no",

    intersectionality_details:
      row.intersectionality_details,

    evidence_type: row.evidence_type,

    evidence_source: row.evidence_source,

    notes: row.notes,

    description:
      row.notes ||
      row.evidence_source ||
      "",

    character_image:
      row.character_image || "",
  }));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const messages: ChatMessage[] =
      body.messages || [];

    const characters =
      loadCharactersFromCSV();

    const latestMessage =
      messages[messages.length - 1]?.content || "";

    const datasetSummary = characters
      .map((character) => {
        return `
Character: ${character.character_name}
Game: ${character.game_title}
Developer: ${character.developer}
Release Year: ${character.release_year}
Genre: ${character.genre}
Narrative Role: ${character.narrative_role}
Playable: ${character.playable_status}
Identity Labels: ${
  character.identity_label?.length
    ? character.identity_label
        .map(formatLabel)
        .join(", ")
    : "Not registered"
}

Identity Categories: ${
  character.identity_category?.length
    ? character.identity_category
        .map(formatLabel)
        .join(", ")
    : "Not registered"
}
Queer Status: ${character.queer_status}
Intersectionality: ${character.intersectionality_present}
Intersectionality Details: ${character.intersectionality_details}
Representation Score: ${character.total_score}
Evidence Source: ${character.evidence_source}
`;
      })
      .join("\n\n");

    const completion =
      await openai.chat.completions.create({
        model: "gpt-4.1-mini",

        messages: [
          {
            role: "system",
            content: `
You are Atlas, an AI-assisted archive system for queer video game characters.

You are NOT a general chatbot.

You ONLY use the registered dataset information provided below.

Language rule:
- Always respond in English unless the user's latest message is clearly written in another language.
- Do not switch languages based on dataset content, names, accents, previous answers, or browser settings.

Rules:

- Never display raw database values with underscores.
- Always convert database formatting into readable human language.
- Never invent information
- Never assume identities or races
- Never speculate
- Never create lore analysis
- Never say "the dataset does not specify"
- If information is missing, say:
"This information is not currently registered in the Atlas dataset."

Style:

- concise
- archival
- direct
- structured
- natural but factual

You may:
- summarize
- compare
- calculate percentages
- list games
- list developers
- list identities
- calculate statistics

Dataset:

${datasetSummary}
`,
          },

          ...messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        ],

        temperature: 0.3,
      });

    const reply =
      completion.choices[0].message.content;

    return NextResponse.json({
      reply,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        reply:
          "Error connecting to Atlas AI.",
      },
      {
        status: 500,
      }
    );
  }
}