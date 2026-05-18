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
  gender?: string;
  sexuality?: string;
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

function normalize(value?: string | null) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function toArray(value?: string) {
  if (!value) return [];

  return value
    .split(";")
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNumber(value?: string) {
  if (!value) return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

function formatLabel(value?: string | null) {
  if (!value) return "Not registered";

  const cleaned = value.replace(/_/g, " ").trim().toLowerCase();

  const aliases: Record<string, string> = {
    gay: "Gay",
    lesbian: "Lesbian",
    bisexual: "Bisexual",
    bi: "Bisexual",
    pansexual: "Pansexual",
    queer: "Queer",
    female: "Female",
    male: "Male",
    trans_man: "Trans Man",
    "trans man": "Trans Man",
    trans_woman: "Trans Woman",
    "trans woman": "Trans Woman",
    non_binary: "Non-Binary",
    "non binary": "Non-Binary",
    nonbinary: "Non-Binary",
    sexual_orientation: "Sexual Orientation",
    "sexual orientation": "Sexual Orientation",
    gender_identity: "Gender Identity",
    "gender identity": "Gender Identity",
    person_of_color: "Person of Color",
    "person of color": "Person of Color",
  };

  return (
    aliases[cleaned] ||
    cleaned.replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function formatArray(values?: string[]) {
  if (!values || values.length === 0) return "Not registered";
  return values.map(formatLabel).join(", ");
}

function loadCharactersFromCSV(): Character[] {
  const filePath = path.join(process.cwd(), "src/data/atlas_seed_dataset.csv");
  const csv = fs.readFileSync(filePath, "utf8");

  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.replace(/^\uFEFF/, "").trim(),
  });

  return parsed.data.map((row) => ({
    character_id: row.character_id || "",
    character_name: row.character_name || "",
    game_title: row.game_title || "",
    release_year: toNumber(row.release_year),
    developer: row.developer || "",
    game_scale: row.game_scale || "",
    genre: row.genre || "",
    narrative_role: row.narrative_role || "",
    playable: normalize(row.playable_status) === "playable",
    playable_status: row.playable_status || "",
    gender: row.gender || "",
    sexuality: row.sexuality || "",
    identity_label: [row.gender, row.sexuality].filter(Boolean),
    identity_category: toArray(row.identity_category),
    identity_confirmation: row.identity_confirmation || "",
    queer_status: row.queer_status || "",
    total_score: toNumber(row.total_score),
    queer_joy_score: toNumber(row.queer_joy_score),
    intersectionality_present: row.intersectionality_present || "",
    intersectionality_details: row.intersectionality_details || "",
    evidence_type: row.evidence_type || "",
    evidence_source: row.evidence_source || "",
    notes: row.notes || "",
    description: row.notes || row.evidence_source || "",
    character_image: row.character_image || "",
  }));
}

function characterToContext(character: Character) {
  return `
Character: ${character.character_name}
Game: ${character.game_title}
Developer: ${character.developer}
Release Year: ${character.release_year ?? "Not registered"}
Genre: ${character.genre || "Not registered"}
Narrative Role: ${formatLabel(character.narrative_role)}
Playable Status: ${formatLabel(character.playable_status)}
Gender: ${formatLabel(character.gender)}
Sexuality: ${formatLabel(character.sexuality)}
Identity Labels: ${formatArray(character.identity_label)}
Identity Categories: ${formatArray(character.identity_category)}
Queer Status: ${formatLabel(character.queer_status)}
Identity Confirmation: ${formatLabel(character.identity_confirmation)}
Intersectionality Registered: ${formatLabel(character.intersectionality_present)}
Intersectionality Details: ${
    character.intersectionality_details || "Not registered"
  }
Representation Score: ${character.total_score ?? "Not registered"}
Queer Joy Score: ${character.queer_joy_score ?? "Not registered"}
Evidence Type: ${formatLabel(character.evidence_type)}
Evidence Source: ${character.evidence_source || "Not registered"}
Notes: ${character.notes || "Not registered"}
`;
}

function buildDatasetContext(characters: Character[]) {
  return characters.map(characterToContext).join("\n---\n");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages: ChatMessage[] = body.messages || [];
    const characters = loadCharactersFromCSV();

    const latestUserMessage =
      messages.filter((message) => message.role === "user").at(-1)?.content ||
      "";

    const datasetContext = buildDatasetContext(characters);

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content: `
You are Atlas, an AI-assisted archive guide for queer video game characters.

You are not a general chatbot. You are a conversational research assistant connected to a structured dataset.

Language rule:
- Always respond in English unless the user's latest message is clearly written in another language.
- Do not switch languages based on browser settings, previous responses, names, or dataset content.

Grounding rules:
- Use only information explicitly present in the dataset context.
- Do not invent facts.
- Do not infer race, ethnicity, religion, disability, nationality, sexuality, gender identity, or representation quality unless it appears in the dataset context.
- Always analyze intersectionality_details when identifying race, ethnicity, religion, disability, or intersectional identities.
- If a character contains "Black" inside intersectionality_details, they should be recognized as a Black character.
- If a character contains "Asian" inside intersectionality_details, they should be recognized as Asian.
- If a character contains "Indigenous" inside intersectionality_details, they should be recognized as Indigenous.
- If information is missing, say: "This information is not currently registered in the Atlas dataset."
- Never display raw database values with underscores. Always convert them into readable language.

Tone:
- Respond in a natural, fluid, conversational academic tone.
- Avoid sounding like a spreadsheet or database.
- Do not always say "registered in the dataset."
- Integrate character information naturally into sentences.
- Use short analytical observations instead of rigid bullet summaries.
- Keep responses concise but human.
- When useful, you may use short lists, but avoid overly mechanical formatting.
- When possible, explain why the representation matters, but only using the information present in the dataset.

Examples of preferred style:
- Instead of: "There is one Asian character registered in the Atlas dataset."
- Say: "Lev is currently the only Asian character represented in the Atlas. His entry also connects trans identity with religion and culture through the intersectionality fields."

- Instead of: "The dataset does not specify..."
- Say: "That detail is not currently registered in the Atlas dataset."

Dataset context:
${datasetContext}
`,
        },
        ...messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
    });

    return NextResponse.json({
      reply: completion.choices[0].message.content || "No response.",
    });
  } catch (error) {
    console.error("API CHAT ERROR:", error);

    return NextResponse.json(
      {
        reply: "Error connecting to Atlas AI.",
      },
      { status: 500 }
    );
  }
}