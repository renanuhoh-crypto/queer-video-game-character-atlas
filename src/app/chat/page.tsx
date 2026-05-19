"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import PrismHeroScene from "@/components/PrismHeroScene";

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
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

function renderMessageContent(content: string, isUser: boolean) {
  const emphasisClass = isUser
    ? "font-black text-black"
    : "font-black text-white";

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
    return "One moment, I'm checking the data...";
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
    return "Um segundo, estou checando os dados...";
  }

  return "One moment, I'm checking the data...";
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm PRSM, your AI-assisted archive guide for queer video game characters. Ask me about characters, identities, representation, games, or intersectionality.",
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
          content: "Error connecting to PRSM AI.",
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

  const transCount = characters.filter((c) => {
    const values = [c.gender, c.sexuality, ...(c.identity_label || [])]
      .filter(Boolean)
      .map((value) => value!.toLowerCase());

    return values.some((value) => value.includes("trans"));
  }).length;

  return (
    <main className="min-h-screen bg-[#020207] text-white">
      {/* HERO */}
      <section className="relative min-h-[560px] overflow-hidden border-b border-white/10 bg-black sm:min-h-[520px]">
        <div className="absolute inset-0 opacity-70">
          <PrismHeroScene />
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.96)_0%,rgba(0,0,0,0.76)_44%,rgba(0,0,0,0.38)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(217,70,239,0.18),transparent_30%),radial-gradient(circle_at_74%_18%,rgba(34,211,238,0.12),transparent_30%)]" />

        <header className="relative z-10 border-b border-white/10">
          <div className="mx-auto flex max-w-[1700px] items-center justify-between px-5 py-5 sm:px-8 md:px-14 md:py-6 lg:px-20">
            <Link href="/" className="text-sm font-black tracking-[0.28em] text-white sm:tracking-[0.35em]">
              PRSM
            </Link>

            <nav className="hidden items-center gap-8 text-sm font-bold text-slate-300 md:flex">
              <Link href="/about" className="transition hover:text-cyan-300">
                About
              </Link>
              <Link href="/methodology" className="transition hover:text-cyan-300">
                Methodology
              </Link>
              <Link href="/analytics" className="transition hover:text-cyan-300">
                Analytics
              </Link>
              <Link href="/" className="transition hover:text-cyan-300">
                Home
              </Link>
              <Link href="/ethics" className="transition hover:text-cyan-300">
                Ethics
              </Link>
            </nav>

            <Link
              href="/analytics"
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-[11px] font-black text-white backdrop-blur-xl transition hover:border-cyan-300/50 hover:text-cyan-300 sm:px-5 sm:py-3 sm:text-xs"
            >
              Explore Data
            </Link>
          </div>
        </header>
        <div className="prism-bar relative z-10 h-3 overflow-hidden border-y border-white/10 bg-black">
          <div className="prism-bar__glow" />
          <div className="prism-bar__spectrum" />
          <div className="prism-bar__shine" />
          <div className="prism-bar__core" />
        </div>
        <div className="relative z-10 mx-auto max-w-[1700px] px-5 py-14 sm:px-8 sm:py-20 md:px-14 lg:px-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-cyan-300 sm:text-xs sm:tracking-[0.45em]">
            Research console
          </p>

          <h1 className="mt-6 text-6xl font-black italic leading-none tracking-normal sm:text-7xl md:text-9xl">
            <span className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">
              PRSM
            </span>
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg md:text-2xl">
            Mapping queer identities across video game worlds.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#archive-console"
              className="inline-flex w-full justify-center rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-6 py-4 text-sm font-black text-white transition hover:scale-105 sm:w-auto"
            >
              Ask PRSM
            </a>

            <Link
              href="/analytics"
              className="inline-flex w-full justify-center rounded-full border border-white/15 bg-white/10 px-6 py-4 text-sm font-black text-white backdrop-blur-xl transition hover:border-fuchsia-300/50 hover:text-fuchsia-300 sm:w-auto"
            >
              View Analytics
            </Link>
          </div>
        </div>
      </section>

      {/* INFO STRIP */}
      <section className="border-b border-white/10 bg-gradient-to-r from-fuchsia-500/20 via-violet-500/20 to-cyan-400/20">
        <div className="mx-auto grid max-w-[1700px] gap-4 px-5 py-5 sm:grid-cols-2 sm:px-8 md:grid-cols-3 md:px-14 lg:px-20">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
              Dataset
            </p>
            <p className="mt-1 text-2xl font-black">{totalCharacters}</p>
            <p className="text-sm text-slate-300">registered characters</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-fuchsia-300">
              Playable
            </p>
            <p className="mt-1 text-2xl font-black">{playableCount}</p>
            <p className="text-sm text-slate-300">playable characters</p>
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
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:rounded-[2rem] sm:p-6 lg:sticky lg:top-6">
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
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left text-sm font-bold text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 sm:text-base"
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-8 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
              <p className="mb-2 text-xs uppercase tracking-[0.25em] text-cyan-300">
                Suggested Prompt
              </p>

              <p className="text-base leading-relaxed text-slate-200">
                Compare Ellie and Lev in terms of identity, role, and
                representation.
              </p>
            </div>

            <a
              href="/analytics"
              className="mt-8 block rounded-3xl border border-fuchsia-400/30 bg-fuchsia-500/10 p-5 text-center text-base font-black text-fuchsia-200 transition hover:bg-fuchsia-500/20"
            >
              View Visual Analytics
            </a>
          </div>
        </aside>

        {/* CHAT CONSOLE */}
        <section className="self-start lg:sticky lg:top-6 lg:col-span-9">
          <div className="flex h-[78svh] min-h-[520px] max-h-[760px] flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/40 shadow-[0_0_80px_rgba(217,70,239,0.08)] backdrop-blur-xl sm:h-[calc(100vh-10rem)] sm:rounded-[2rem] lg:h-[calc(100vh-14rem)] lg:min-h-[420px] lg:max-h-[720px]">
            <div className="border-b border-white/10 px-5 py-4 sm:px-8 sm:py-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-300 sm:text-xs sm:tracking-[0.35em]">
                Research Console
              </p>
              <h2 className="mt-2 text-xl font-black italic text-white sm:text-2xl">
                Ask PRSM about queer game representation
              </h2>
            </div>

            <div
              ref={messagesContainerRef}
              className="min-h-0 flex-1 overflow-y-auto p-4 pb-5 sm:p-8 sm:pb-8"
            >
              <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:gap-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`max-w-[92%] rounded-3xl border p-5 sm:max-w-[78%] sm:p-6 ${
                      message.role === "user"
                        ? "ml-auto border-white/10 bg-zinc-100 text-black"
                        : "border-fuchsia-400/20 bg-[#12092f] text-white"
                    }`}
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <div
                        className={`h-4 w-4 rounded-full ${
                          message.role === "user"
                            ? "bg-violet-500"
                            : "bg-gradient-to-r from-cyan-300 to-fuchsia-400"
                        }`}
                      />

                      <p className="text-lg font-black italic sm:text-xl">
                        {message.role === "user" ? "You" : "PRSM"}
                      </p>
                    </div>

                    <div
                      className={`whitespace-pre-wrap text-base leading-relaxed md:text-lg ${
                        message.role === "user" ? "text-black" : "text-slate-100"
                      }`}
                    >
                      {renderMessageContent(
                        message.content,
                        message.role === "user"
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="max-w-[92%] rounded-3xl border border-fuchsia-400/20 bg-[#12092f] p-5 sm:max-w-[78%] sm:p-6">
                    <p className="text-base text-slate-300 sm:text-lg">
                      {getLoadingMessage(messages)}
                    </p>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="shrink-0 border-t border-white/10 bg-[#090313]/95 px-4 py-4 backdrop-blur-xl sm:px-5 sm:py-5">
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
                  placeholder="Ask PRSM about queer game characters..."
                  className="min-w-0 flex-1 rounded-full border border-fuchsia-400/40 bg-zinc-100 px-4 py-3 text-sm text-black outline-none transition focus:border-cyan-300 sm:px-6 sm:py-4 sm:text-base md:text-lg"
                />

                <button
                  onClick={sendMessage}
                  disabled={loading}
                  className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3 text-base font-black transition hover:scale-105 disabled:opacity-50 sm:px-8 sm:py-4 sm:text-xl"
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
