"use client";

import { useEffect, useRef, useState } from "react";
import PrismPageHero from "@/components/PrismPageHero";

type Character = {
  character_name: string;
  game_title: string;
  release_year?: number | null;
  developer?: string;
  playable?: boolean;
  playable_status?: string;
  gender?: string;
  sexuality?: string;
  identity_label?: string[];
  evidence_source?: string;
  character_image?: string;
  image_credit?: string;
  image_source_url?: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

function renderMessageContent(content: string, isUser: boolean) {
  const emphasisClass = isUser
    ? "font-black text-[#12152b]"
    : "font-black text-[#3545d3]";

  return content
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    .map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className={emphasisClass}>
            {part.slice(2, -2)}
          </strong>
        );
      }

      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <strong key={index} className={emphasisClass}>
            {part.slice(1, -1)}
          </strong>
        );
      }

      return <span key={index}>{part}</span>;
    });
}

function getLoadingMessage(messages: Message[]) {
  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user")?.content;

  if (!latestUserMessage) {
    return "One moment, Quiu is checking the Press Q dataset...";
  }

  const normalized = latestUserMessage
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const portuguesePattern =
    /\b(quantas|quantos|qual|quais|como|sobre|lesbicas|personagens|jogos|dados|espera|oi|ola|voce|tem|sao|pra)\b/;
  const englishPattern =
    /\b(wait|what|which|who|where|why|how|can|please|game|games|characters|data|hello|hi)\b/;

  if (portuguesePattern.test(normalized) && !englishPattern.test(normalized)) {
    return "Um segundo, Quiu está consultando o Press Q dataset...";
  }

  return "One moment, Quiu is checking the Press Q dataset...";
}

function normalizeForMatch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getEvidenceCharacters(content: string, characters: Character[]) {
  const normalizedContent = normalizeForMatch(content);

  return characters
    .filter((character) => {
      if (!character.character_image) return false;

      const characterName = normalizeForMatch(character.character_name);
      return characterName.length > 1 && normalizedContent.includes(characterName);
    })
    .slice(0, 3);
}

function EvidenceCards({ characters }: { characters: Character[] }) {
  if (characters.length === 0) return null;

  return (
    <div className="grid max-w-[92%] gap-3 sm:max-w-[78%] md:grid-cols-2">
      {characters.map((character) => (
        <article
          key={`${character.character_name}-${character.game_title}`}
          className="overflow-hidden border border-[#dfe3f3] bg-white shadow-[0_18px_45px_rgba(50,64,145,0.1)]"
        >
          <div className="aspect-[16/10] overflow-hidden bg-black">
            <img
              src={character.character_image}
              alt={`${character.character_name} from ${character.game_title}`}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="space-y-3 p-4">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-[#4f5fe7]">
                Evidence card
              </p>
              <h3 className="mt-2 text-lg font-black text-[#12152b]">
                {character.character_name}
              </h3>
              <p className="text-sm text-[#707695]">{character.game_title}</p>
            </div>

            {character.image_credit ? (
              <p className="text-xs leading-relaxed text-[#707695]">
                Image credit:{" "}
                <span className="text-[#3f4664]">{character.image_credit}</span>
              </p>
            ) : null}

            {character.evidence_source ? (
              <p className="text-xs leading-relaxed text-[#707695]">
                Evidence:{" "}
                <span className="text-[#3f4664]">
                  {character.evidence_source}
                </span>
              </p>
            ) : null}

            {character.image_source_url ? (
              <a
                href={character.image_source_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-xs font-black uppercase tracking-[0.16em] text-[#4f5fe7] transition hover:text-[#3545d3]"
              >
                View image source
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Quiu, the conversational AI guide for Press Q, an AI-Assisted Queer Game Archive. Ask me about characters, identities, representation, games, or intersectionality.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    async function loadCharacters() {
      try {
        const response = await fetch("/api/characters");
        const data = await response.json();
        setCharacters(data.characters || []);
      } catch (error) {
        console.error("Failed loading characters:", error);
      }
    }

    loadCharacters();
  }, []);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
        }),
      });

      const data = await response.json();

      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: data.reply,
        },
      ]);
    } catch (error) {
      console.error(error);

      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: "Error connecting to Quiu.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus({ preventScroll: true });
    }
  }

  const totalCharacters = characters.length;

  const playableCount = characters.filter(
    (c) =>
      c.playable ||
      c.playable_status?.trim().toLowerCase() === "playable"
  ).length;

  return (
    <main className="pq-page pq-chat-page min-h-screen bg-[#f7f7fb] text-[#12152b]">
      <PrismPageHero
        eyebrow="Research console"
        title="Ask"
        accent="Quiu"
        description="Use natural language to explore queer identities, characters, games, and representation patterns grounded in the Press Q dataset."
      />

      {/* INFO STRIP */}
      <section className="border-b border-[#dfe3f3] bg-[#eef0ff]">
        <div className="mx-auto grid max-w-[1700px] gap-4 px-5 py-5 sm:grid-cols-2 sm:px-8 md:grid-cols-3 md:px-14 lg:px-20">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#4f5fe7]">
              Press Q dataset
            </p>
            <p className="mt-1 text-2xl font-black">{totalCharacters}</p>
            <p className="text-sm text-[#646b89]">registered characters</p>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#4f5fe7]">
              Playable
            </p>
            <p className="mt-1 text-2xl font-black">{playableCount}</p>
            <p className="text-sm text-[#646b89]">playable characters</p>
          </div>
        </div>
      </section>

      {/* MAIN */}
      <section
        id="archive-console"
        className="mx-auto grid max-w-[1700px] gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-12"
      >
        {/* SIDEBAR */}
        <aside className="lg:col-span-3">
          <div className="pq-panel p-5 sm:p-6 lg:sticky lg:top-6">
            <h2 className="text-2xl font-black italic sm:text-3xl">Archive Tools</h2>

            <div className="mt-6 space-y-3">
              {[
                "Queer protagonists",
                "Trans characters",
                "Playable characters",
                "Intersectionality",
                "Compare games",
              ].map((item) => (
                <button
                  key={item}
                  onClick={() => setInput(item)}
                  className="w-full border border-[#dfe3f3] bg-white px-4 py-4 text-left text-sm font-bold text-[#3d4361] transition hover:border-[#4f5fe7] hover:bg-[#eef0ff] sm:text-base"
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-8 border border-[#ccd2f4] bg-[#eef0ff] p-5">
              <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-[#4f5fe7]">
                Suggested Prompt
              </p>

              <p className="text-base leading-relaxed text-[#4e5574]">
                Compare Ellie and Lev in terms of identity, role, and
                representation.
              </p>
            </div>

            <a
              href="/analytics"
              className="mt-8 block border border-[#4f5fe7] bg-[#4f5fe7] p-5 text-center text-base font-black text-white transition hover:bg-[#3545d3]"
            >
              View Visual Analytics
            </a>
          </div>
        </aside>

        {/* CHAT CONSOLE */}
        <section className="self-start lg:sticky lg:top-6 lg:col-span-9">
          <div className="pq-chat-console flex h-[78svh] min-h-[520px] max-h-[760px] flex-col overflow-hidden sm:h-[calc(100vh-10rem)] lg:h-[calc(100vh-14rem)] lg:min-h-[420px] lg:max-h-[720px]">
            <div className="border-b border-[#dfe3f3] px-5 py-4 sm:px-8 sm:py-5">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#4f5fe7] sm:text-xs sm:tracking-[0.35em]">
                Research Console
              </p>
              <h2 className="mt-2 text-xl font-black text-[#12152b] sm:text-2xl">
                Ask Quiu about queer game representation
              </h2>
            </div>

            <div
              ref={messagesContainerRef}
              className="min-h-0 flex-1 overflow-y-auto p-4 pb-5 sm:p-8 sm:pb-8"
            >
              <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:gap-6">
                {messages.map((message, index) => {
                  const previousUserMessage =
                    messages
                      .slice(0, index)
                      .reverse()
                      .find((item) => item.role === "user")?.content || "";
                  const evidenceCharacters =
                    message.role === "assistant"
                      ? getEvidenceCharacters(
                          `${previousUserMessage} ${message.content}`,
                          characters
                        )
                      : [];

                  return (
                    <div key={index} className="contents">
                      <div
                        className={`max-w-[92%] rounded-3xl border p-5 sm:max-w-[78%] sm:p-6 ${
                          message.role === "user"
                            ? "ml-auto border-[#ccd2f4] bg-[#eef0ff] text-[#12152b]"
                            : "border-[#dfe3f3] bg-white text-[#12152b]"
                        }`}
                      >
                        <div className="mb-4 flex items-center gap-3">
                          <div
                            className={`h-4 w-4 rounded-full ${
                              message.role === "user"
                                ? "bg-[#8192ef]"
                                : "bg-[#4f5fe7]"
                            }`}
                          />

                          <p className="text-lg font-black italic sm:text-xl">
                            {message.role === "user" ? "You" : "Quiu"}
                          </p>
                        </div>

                        <div
                          className={`whitespace-pre-wrap text-base leading-relaxed md:text-lg ${
                            message.role === "user"
                              ? "text-[#12152b]"
                              : "text-[#39405f]"
                          }`}
                        >
                          {renderMessageContent(
                            message.content,
                            message.role === "user"
                          )}
                        </div>
                      </div>

                      <EvidenceCards characters={evidenceCharacters} />
                    </div>
                  );
                })}

                {loading && (
                  <div className="max-w-[92%] border border-[#dfe3f3] bg-white p-5 sm:max-w-[78%] sm:p-6">
                    <p className="text-base text-[#646b89] sm:text-lg">
                      {getLoadingMessage(messages)}
                    </p>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="shrink-0 border-t border-[#dfe3f3] bg-white px-4 py-4 sm:px-5 sm:py-5">
              <div className="mx-auto flex max-w-5xl gap-3 sm:gap-4">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      sendMessage();
                    }
                  }}
                  placeholder="Ask Quiu about queer game characters..."
                  className="min-w-0 flex-1 border border-[#cbd1eb] bg-[#f7f7fb] px-4 py-3 text-sm text-[#12152b] outline-none transition focus:border-[#4f5fe7] sm:px-6 sm:py-4 sm:text-base md:text-lg"
                />

                <button
                  onClick={sendMessage}
                  disabled={loading}
                  className="bg-[#4f5fe7] px-5 py-3 text-base font-black text-white transition hover:bg-[#3545d3] disabled:opacity-50 sm:px-8 sm:py-4 sm:text-xl"
                >
                  GO
                </button>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
