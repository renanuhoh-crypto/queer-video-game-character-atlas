import OpenAI from "openai";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import {
  QueerSystemRow,
  readQueerSystemRows,
} from "@/lib/queerSystemDataset";
import {
  QueerReadingRow,
  readQueerReadingRows,
} from "@/lib/queerReadingDataset";
import {
  chatLanguageDirective,
  detectChatLanguage,
} from "@/lib/chatLanguage";

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
  image_credit?: string;
  image_source_url?: string;
  discovery_source?: string;
  research_status?: string;
  evidence_confidence?: string;
  platform_version?: string;
  last_reviewed?: string;
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
  const filePath = path.join(process.cwd(), "src/data/pressq_seed_dataset.csv");
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
    image_credit: row.image_credit || "",
    image_source_url: row.image_source_url || "",
    discovery_source: row.discovery_source || "",
    research_status: row.research_status || "",
    evidence_confidence: row.evidence_confidence || "",
    platform_version: row.platform_version || "",
    last_reviewed: row.last_reviewed || "",
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
Image Available: ${character.character_image ? "Yes" : "No"}
Image Credit: ${character.image_credit || "Not registered"}
Image Source URL: ${character.image_source_url || "Not registered"}
Discovery Source: ${character.discovery_source || "Not registered"}
Research Status: ${formatLabel(character.research_status)}
Evidence Confidence: ${formatLabel(character.evidence_confidence)}
Platform or Version: ${character.platform_version || "Not registered"}
Last Reviewed: ${character.last_reviewed || "Not registered"}
Notes: ${character.notes || "Not registered"}
`;
}

function buildDatasetContext(characters: Character[]) {
  return characters.map(characterToContext).join("\n---\n");
}

function queerSystemToContext(system: QueerSystemRow) {
  return `
Game: ${system.game_title}
Release Year: ${system.release_year || "Not registered"}
System Type: ${formatLabel(system.system_type)}
Scope: ${formatLabel(system.scope)}
Player Dependency: ${formatLabel(system.player_dependency)}
Availability: ${formatLabel(system.availability)}
System Description: ${system.system_description || "Not registered"}
Limitations: ${system.limitations || "Not registered"}
Evidence Source: ${system.evidence_source || "Not registered"}
Discovery Source: ${system.discovery_source || "Not registered"}
Research Status: ${formatLabel(system.research_status)}
Evidence Confidence: ${formatLabel(system.evidence_confidence)}
Platform or Version: ${system.platform_version || "Not registered"}
Last Reviewed: ${system.last_reviewed || "Not registered"}
Notes: ${system.notes || "Not registered"}
`;
}

function buildQueerSystemsContext(systems: QueerSystemRow[]) {
  if (systems.length === 0) return "No game-system records registered yet.";
  return systems.map(queerSystemToContext).join("\n---\n");
}

function queerReadingToContext(reading: QueerReadingRow) {
  return `
Subject: ${reading.subject || "Not registered"}
Game: ${reading.game_title || "Not registered"}
Release Year: ${reading.release_year || "Not registered"}
Subject Type: ${formatLabel(reading.subject_type)}
Reading Type: ${formatLabel(reading.reading_type)}
Reading Status: ${formatLabel(reading.reading_status)}
Reading Summary: ${reading.reading_summary || "Not registered"}
Counterevidence: ${reading.counterevidence || "Not registered"}
Evidence Source: ${reading.evidence_source || "Not registered"}
Discovery Source: ${reading.discovery_source || "Not registered"}
Research Status: ${formatLabel(reading.research_status)}
Evidence Confidence: ${formatLabel(reading.evidence_confidence)}
Platform or Version: ${reading.platform_version || "Not registered"}
Last Reviewed: ${reading.last_reviewed || "Not registered"}
Notes: ${reading.notes || "Not registered"}
`;
}

function buildQueerReadingsContext(readings: QueerReadingRow[]) {
  if (readings.length === 0) return "No queer-reading records registered yet.";
  return readings.map(queerReadingToContext).join("\n---\n");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages: ChatMessage[] = body.messages || [];
    const characters = loadCharactersFromCSV();
    const queerSystems = readQueerSystemRows();
    const queerReadings = readQueerReadingRows();

    const datasetContext = buildDatasetContext(characters);
    const queerSystemsContext = buildQueerSystemsContext(queerSystems);
    const queerReadingsContext = buildQueerReadingsContext(queerReadings);
    const responseLanguage = detectChatLanguage(messages);
    const latestUserIndex = messages.findLastIndex(
      (message) => message.role === "user",
    );
    const conversationMessages: Array<{
      role: "user" | "assistant" | "system";
      content: string;
    }> = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    if (latestUserIndex >= 0) {
      conversationMessages.splice(latestUserIndex, 0, {
        role: "system",
        content: chatLanguageDirective(responseLanguage),
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content: `
You are Quiu, the conversational AI guide for Press Q, an AI-Assisted Queer Game Archive.

You are not a general chatbot. You are a conversational research assistant connected to the structured Press Q dataset.

Language rule:
- A separate turn-level system instruction declares the mandatory response language. Follow it exactly.
- Always respond in the same language as the user's latest message.
- If the latest message is in Portuguese, respond in Portuguese.
- If the latest message is short or informal, infer the language from its words; for example, "quantas lesbicas" is Portuguese and must receive a Portuguese answer.
- Do not switch languages based on browser settings, previous responses, names, game titles, character names, or Press Q dataset content.
- If you are unsure, prefer the language used by the user's latest message over English.

Grounding rules:
- Use only information explicitly present in the provided Press Q dataset contexts.
- Do not invent facts.
- Keep character records, game-system records, and queer-reading records as distinct units of analysis.
- A game-system record describes what a game permits a player to do or construct. It is not evidence that a specific character has a canonical queer identity.
- A queer-reading record documents critical or audience interpretation, debate, or reception. It is not evidence that its subject has a canonical queer identity.
- Never count queer-reading records in character gender or sexuality totals. Report their counts separately and preserve reading_status, counterevidence, and evidence_confidence.
- If a reading is creator_refuted or contested, state that qualification clearly rather than repeating the interpretation as fact.
- Gender-independent romance must not be used to infer that every compatible NPC is canonically bisexual or pansexual.
- A character sexuality value of "player_defined" describes mutually exclusive outcomes controlled by player choice, not a fixed orientation. Explain the documented possibilities from the notes and never count each possible route as a simultaneous canonical identity.
- Counts describe documented Press Q records only. Never present them as the percentage or prevalence of LGBTQ+ content across all published games.
- When the user asks what a category or number means, identify the unit of analysis, define the term, state the denominator, explain the inclusion boundary, and name what the number cannot establish. Mention overlapping categories when relevant.
- Treat "unknown", "not recorded", and "none documented" as research limitations, not presumed cisgender, heterosexual, white, able-bodied, or otherwise default identities.
- Distinguish those limitations precisely: "unknown" means the relevant evidence was considered but remains inconclusive; "not recorded" means Press Q currently has no documented value for the field; "none documented" means the current research found no supported marker. None proves absence.
- General labels such as man and woman do not establish cisgender status. Trans men are men and trans women are women; specific trans labels preserve a documented trans dimension rather than defining an opposing gender.
- Keep gender identity, gender expression, sexual orientation, and romantic orientation distinct. Do not infer one from another.
- When research_status, evidence_confidence, platform_version, or limitations qualify an entry, preserve those qualifications in the answer.
- Do not infer race, ethnicity, religion, disability, nationality, sexuality, gender identity, or representation quality unless it appears in the Press Q dataset context.
- Always analyze intersectionality_details when identifying race, ethnicity, religion, disability, or intersectional identities.
- If a character contains "Black" inside intersectionality_details, they should be recognized as a Black character.
- If a character contains "Asian" inside intersectionality_details, they should be recognized as Asian.
- If a character contains "Indigenous" inside intersectionality_details, they should be recognized as Indigenous.
- If information is missing, say that this information is not currently registered in the Press Q dataset, translated into the user's language.
- Never display raw database values with underscores. Always convert them into readable language.
- If a character has image information, you may mention that an evidence card is available in the interface, but do not invent image credits or sources.

Tone:
- Respond in a natural, fluid, conversational academic tone.
- Match the user's language naturally and warmly.
- Avoid sounding like a spreadsheet or database.
- Do not always say "registered in the Press Q dataset."
- Integrate character information naturally into sentences.
- Use short analytical observations instead of rigid bullet summaries.
- Keep responses concise but human.
- When useful, you may use short lists, but avoid overly mechanical formatting.
- When possible, explain why the representation matters, but only using the information present in the Press Q dataset.
- If asked for methodological support beyond what is present in the dataset contexts, direct the user to the Press Q Methodology and Ethics pages instead of inventing a citation.
- If you use emphasis for game titles or character names, use Markdown emphasis consistently.

Examples of preferred style:
- Instead of: "There is one Asian character registered in the Press Q dataset."
- Say: "Lev is currently the only Asian character represented in the Press Q dataset. His entry also connects trans identity with religion and culture through the intersectionality fields."

- Instead of: "The Press Q dataset does not specify..."
- Say: "That detail is not currently registered in the Press Q dataset."

Press Q character-level context:
${datasetContext}

Press Q game/system-level context:
${queerSystemsContext}

Press Q queer-reading context:
${queerReadingsContext}
`,
        },
        ...conversationMessages,
      ],
    });

    return NextResponse.json({
      reply: completion.choices[0].message.content || "No response.",
    });
  } catch (error) {
    console.error("API CHAT ERROR:", error);

    return NextResponse.json(
      {
        reply: "Error connecting to Quiu.",
      },
      { status: 500 }
    );
  }
}
