export type ChatLanguage = "English" | "Portuguese";

type LanguageMessage = {
  role: "user" | "assistant";
  content: string;
};

const PORTUGUESE_WORDS = new Set([
  "agora",
  "aqui",
  "como",
  "dados",
  "fale",
  "jogos",
  "liste",
  "mostre",
  "personagens",
  "pode",
  "poderia",
  "porque",
  "qual",
  "quais",
  "quantas",
  "quantos",
  "quem",
  "quero",
  "sobre",
  "tambem",
  "tem",
  "voce",
]);

const ENGLISH_WORDS = new Set([
  "about",
  "are",
  "can",
  "characters",
  "could",
  "data",
  "games",
  "hello",
  "hey",
  "hi",
  "how",
  "is",
  "list",
  "please",
  "show",
  "tell",
  "the",
  "what",
  "where",
  "which",
  "who",
  "why",
  "would",
]);

function classifyMessage(content: string): ChatLanguage | null {
  const hasPortugueseDiacritics = /[áàâãéêíóôõúç]/i.test(content);
  const normalized = content
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const words = normalized.match(/[a-z]+/g) || [];

  let portugueseScore = hasPortugueseDiacritics ? 3 : 0;
  let englishScore = 0;

  for (const word of words) {
    if (PORTUGUESE_WORDS.has(word)) portugueseScore += 1;
    if (ENGLISH_WORDS.has(word)) englishScore += 1;
  }

  if (portugueseScore > englishScore) return "Portuguese";
  if (englishScore > portugueseScore) return "English";
  return null;
}

export function detectChatLanguage(messages: LanguageMessage[]): ChatLanguage {
  const userMessages = messages
    .filter((message) => message.role === "user")
    .reverse();

  for (const message of userMessages) {
    const language = classifyMessage(message.content);
    if (language) return language;
  }

  return "English";
}

export function chatLanguageDirective(language: ChatLanguage) {
  return `Mandatory response language for this turn: ${language}.
Reply entirely in ${language}, including the introduction, headings, explanations, list labels, and closing sentence.
Keep character names, game titles, and source titles unchanged.
This turn-level language instruction overrides the language of earlier messages, examples, and dataset content.`;
}
