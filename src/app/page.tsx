"use client";

import { useEffect, useRef, useState } from "react";

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

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I’m PRSM, your AI-assisted archive guide for queer video game characters. Ask me about characters, identities, representation, games, or intersectionality.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
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
    <main className="min-h-screen bg-[#03030a] text-white">
      {/* HERO */}
      <section className="relative min-h-[520px] overflow-hidden border-b border-white/10 bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_40%,rgba(34,211,238,0.20),transparent_34%),radial-gradient(circle_at_45%_25%,rgba(217,70,239,0.18),transparent_30%),radial-gradient(circle_at_85%_55%,rgba(250,204,21,0.12),transparent_22%)]" />

        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:40px_40px]" />

        <div className="absolute right-[-8%] top-1/2 h-32 w-[70%] -translate-y-1/2 -rotate-6 animate-pulse bg-gradient-to-r from-transparent via-fuchsia-400/50 via-cyan-300/50 to-yellow-200/60 blur-2xl" />

        <div className="absolute right-[28%] top-1/2 h-32 w-32 -translate-y-1/2 rotate-45 border border-white/20 bg-white/5 backdrop-blur-xl shadow-[0_0_90px_rgba(34,211,238,0.35)]">
          <div className="absolute inset-3 border border-fuchsia-300/30" />
        </div>

        <div className="absolute right-[18%] top-[38%] h-2 w-52 rotate-[-18deg] rounded-full bg-cyan-300/70 blur-sm" />
        <div className="absolute right-[12%] top-[52%] h-2 w-72 rotate-[12deg] rounded-full bg-fuchsia-400/60 blur-sm" />
        <div className="absolute right-[8%] top-[64%] h-2 w-56 rotate-[-5deg] rounded-full bg-yellow-200/60 blur-sm" />

        <header className="relative z-10 border-b border-white/10">
          <div className="mx-auto flex max-w-[1700px] items-center justify-between px-8 py-6 md:px-14 lg:px-20">
            <a href="/" className="text-sm font-black tracking-[0.35em] text-white">
              PRSM
            </a>

            <nav className="hidden items-center gap-8 text-sm font-bold text-slate-300 md:flex">
              <a href="/about" className="transition hover:text-cyan-300">
                About
              </a>
              <a href="/methodology" className="transition hover:text-cyan-300">
                Methodology
              </a>
              <a href="/analytics" className="transition hover:text-cyan-300">
                Analytics
              </a>
              <a href="/dataset" className="transition hover:text-cyan-300">
                Dataset
              </a>
              <a href="/ethics" className="transition hover:text-cyan-300">
                Ethics
              </a>
            </nav>

            <a
              href="/analytics"
              className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-xs font-black text-white backdrop-blur-xl transition hover:border-cyan-300/50 hover:text-cyan-300"
            >
              Explore Data
            </a>
          </div>
        </header>
<div className="relative z-10 h-3 overflow-hidden border-y border-white/10 bg-black">
  <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 via-orange-300 via-lime-300 via-cyan-300 to-violet-500" />

  <div className="absolute inset-0 opacity-60 mix-blend-screen bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.7)_20%,transparent_40%,rgba(255,255,255,0.5)_60%,transparent_100%)] bg-[length:250%_100%] animate-pulse" />

  <div className="absolute inset-0 blur-lg opacity-60 bg-gradient-to-r from-fuchsia-500 via-cyan-300 to-violet-500" />
</div>
        <div className="relative z-10 mx-auto max-w-[1700px] px-8 py-20 md:px-14 lg:px-20">
          <p className="text-xs uppercase tracking-[0.45em] text-cyan-300">
            AI-Assisted Queer Game Archive
          </p>

          <h1 className="mt-6 text-7xl font-black italic leading-none tracking-tight md:text-9xl">
            <span className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">
              PRSM
            </span>
          </h1>

          <p className="mt-6 max-w-3xl text-xl leading-relaxed text-slate-300 md:text-2xl">
            Mapping queer identities across video game worlds.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#archive-console"
              className="rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-6 py-4 text-sm font-black text-white transition hover:scale-105"
            >
              Ask PRSM
            </a>

            <a
              href="/analytics"
              className="rounded-full border border-white/15 bg-white/10 px-6 py-4 text-sm font-black text-white backdrop-blur-xl transition hover:border-fuchsia-300/50 hover:text-fuchsia-300"
            >
              View Analytics
            </a>
          </div>
        </div>
      </section>

      {/* INFO STRIP */}
      <section className="border-b border-white/10 bg-gradient-to-r from-fuchsia-500/20 via-violet-500/20 to-cyan-400/20">
        <div className="mx-auto grid max-w-[1700px] gap-4 px-8 py-5 md:grid-cols-3 md:px-14 lg:px-20">
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
        className="mx-auto grid max-w-[1700px] gap-6 px-6 py-8 lg:grid-cols-12"
      >
        {/* SIDEBAR */}
        <aside className="lg:col-span-3">
          <div className="sticky top-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
            <h2 className="text-3xl font-black italic">Archive Tools</h2>

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
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left text-base font-bold text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
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
        <section className="lg:sticky lg:top-6 lg:col-span-9 self-start">
          <div className="flex h-[calc(100vh-120px)] min-h-[650px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 shadow-[0_0_80px_rgba(217,70,239,0.08)] backdrop-blur-xl">
            <div className="border-b border-white/10 px-8 py-5">
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
                Research Console
              </p>
              <h2 className="mt-2 text-2xl font-black italic text-white">
                Ask PRSM about queer game representation
              </h2>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-8 pb-8">
              <div className="mx-auto flex max-w-5xl flex-col gap-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`max-w-[78%] rounded-3xl border p-6 ${
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

                      <p className="text-xl font-black italic">
                        {message.role === "user" ? "You" : "PRSM"}
                      </p>
                    </div>

                    <div
                      className={`whitespace-pre-wrap text-base leading-relaxed md:text-lg ${
                        message.role === "user" ? "text-black" : "text-slate-100"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="max-w-[78%] rounded-3xl border border-fuchsia-400/20 bg-[#12092f] p-6">
                    <p className="text-lg text-slate-300">
                      PRSM is refracting the dataset...
                    </p>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="sticky bottom-0 z-20 shrink-0 border-t border-white/10 bg-[#090313]/95 px-5 pt-5 pb-5 backdrop-blur-xl">
              <div className="mx-auto flex max-w-5xl gap-4">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      sendMessage();
                    }
                  }}
                  placeholder="Ask PRSM about queer game characters..."
                  className="flex-1 rounded-full border border-fuchsia-400/40 bg-zinc-100 px-6 py-4 text-base text-black outline-none transition focus:border-cyan-300 md:text-lg"
                />

                <button
                  onClick={sendMessage}
                  disabled={loading}
                  className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-8 py-4 text-xl font-black transition hover:scale-105 disabled:opacity-50"
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
