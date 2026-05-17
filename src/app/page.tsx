"use client";

import { useEffect, useRef, useState } from "react";
import VisualAnalytics from "@/components/VisualAnalytics";

type Character = {
  character_name: string;
  game_title: string;
  release_year?: number | null;
  developer?: string;
  playable?: boolean;
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
        "Hi! I’m Atlas, your AI-assisted archive guide for queer video game characters. Ask me about characters, identities, representation, games, or intersectionality.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(true);

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
      } finally {
        setLoadingCharacters(false);
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
          content: "Error connecting to Atlas AI.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="h-screen overflow-hidden bg-[#05010f] text-white">
      {/* HEADER */}
      <header className="border-b border-white/10 bg-[#05010f]">
  {/* TOP HEADER */}
  <div className="mx-auto flex max-w-[1700px] items-center justify-between px-8 py-6 md:px-14 lg:px-20">
    <a href="/" className="group">
      <p className="text-xs uppercase tracking-[0.45em] text-cyan-300">
        AI-Assisted Archive
      </p>

      <h1 className="mt-3 text-3xl font-black italic leading-none tracking-tight md:text-5xl">
        <span className="text-white">Queer Video Game </span>
        <span className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">
          Character Atlas
        </span>
      </h1>
    </a>

    <div className="hidden items-center gap-4 md:flex">
      <a
        href="/analytics"
        className="rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-4 text-sm font-black text-white transition hover:scale-105"
      >
        Analytics
      </a>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-right">
        <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
          Dataset Mode
        </p>

        <p className="mt-1 text-sm font-bold text-fuchsia-300">
          Prototype v1.0
        </p>
      </div>
    </div>
  </div>

  {/* SUBTITLE */}
  <div className="mx-auto max-w-[1700px] px-8 pb-6 md:px-14 lg:px-20">
    <p className="max-w-4xl text-base leading-relaxed text-slate-300 md:text-lg">
      Explore queer characters, games, identities, intersectionality, and
      representation through a living research dataset.
    </p>
  </div>

  {/* NAV BAR */}
  <nav className="border-t border-white/10 bg-gradient-to-r from-fuchsia-500/20 via-violet-500/20 to-cyan-400/20">
    <div className="mx-auto flex max-w-[1700px] overflow-x-auto px-8 md:px-14 lg:px-20">
      {[
        ["Home", "/"],
        ["About", "/about"],
        ["Methodology", "/methodology"],
        ["Analytics", "/analytics"],
        ["Ethics", "/ethics"],
      ].map(([label, href]) => (
        <a
          key={href}
          href={href}
          className="border-r border-white/10 px-5 py-4 text-sm font-bold text-slate-200 transition first:border-l hover:bg-white/10 hover:text-cyan-300 md:text-base"
        >
          {label}
        </a>
      ))}
    </div>
  </nav>
</header>

      {/* MAIN LAYOUT */}
      <div className="grid h-[calc(100vh-210px)] min-h-0 grid-cols-12 gap-6 overflow-hidden px-6 py-6">
        {/* SIDEBAR */}
        <aside className="col-span-3 min-h-0 overflow-y-auto rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-5 text-3xl font-black italic">Archive Tools</h2>

          <div className="space-y-3">
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
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left text-base transition hover:border-fuchsia-400/40 hover:bg-fuchsia-500/10"
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mt-10 space-y-3">


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
  className="mt-8 block rounded-3xl border border-fuchsia-400/30 bg-fuchsia-500/10 p-5 text-center text-base font-bold text-fuchsia-200 transition hover:bg-fuchsia-500/20"
>
  View Visual Analytics
</a>
        </aside>

        {/* CHAT */}
        <section className="col-span-9 flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/20">
          {/* CHAT MESSAGES */}
          <div className="min-h-0 flex-1 overflow-y-auto p-8 pb-14">
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
                      {message.role === "user" ? "You" : "Atlas"}
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
                    Atlas is analyzing the dataset...
                  </p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* FIXED INPUT */}
          <div className="shrink-0 border-t border-white/10 bg-[#090313]/95 px-5 pt-6 pb-8 backdrop-blur-xl">
            <div className="mx-auto flex max-w-5xl gap-4">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                  }
                }}
                placeholder="Ask Atlas about queer game characters..."
                className="flex-1 rounded-3xl border border-fuchsia-400/40 bg-zinc-100 px-6 py-4 text-base text-black outline-none transition focus:border-cyan-300 md:text-lg"
              />

              <button
                onClick={sendMessage}
                disabled={loading}
                className="rounded-3xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-8 py-4 text-xl font-black transition hover:scale-105 disabled:opacity-50"
              >
                GO
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}