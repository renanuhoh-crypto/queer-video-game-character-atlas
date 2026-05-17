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
    <main className="min-h-screen bg-[#05010f] text-white">
      {/* HEADER */}
      <header className="border-b border-white/10 bg-white/[0.03] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1700px] items-start justify-between px-8 py-8 md:px-14 lg:px-20">
          <div className="max-w-5xl">
            <p className="mb-3 text-xs uppercase tracking-[0.45em] text-cyan-300">
              AI-Assisted Archive
            </p>

            <h1 className="leading-none text-5xl font-black italic tracking-tight md:text-7xl">
              <span className="text-white">Queer Video Game </span>

              <span className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">
                Character Atlas
              </span>
            </h1>

            <p className="mt-5 max-w-4xl text-base leading-relaxed text-slate-300 md:text-xl">
              Explore queer characters, games, identities, intersectionality,
              and representation through a living research dataset.
            </p>
          </div>

          <div className="hidden rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-5 text-right md:block">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Dataset Mode
            </p>

            <p className="mt-2 text-xl font-bold text-fuchsia-300">
              Prototype v1.0
            </p>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-12 gap-6 px-6 py-6">
        {/* SIDEBAR */}
        <aside className="col-span-3 h-[82vh] overflow-y-auto rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="mb-6 text-4xl font-black italic">Archive Tools</h2>

          <div className="space-y-4">
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
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5 text-left text-xl transition hover:border-fuchsia-400/40 hover:bg-fuchsia-500/10"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6">
            <p className="mb-3 text-sm uppercase tracking-[0.25em] text-cyan-300">
              Suggested Prompt
            </p>

            <p className="text-xl leading-relaxed text-slate-200">
              Compare Ellie and Lev in terms of identity, role, and
              representation.
            </p>
          </div>

          <div className="mt-10">
            {loadingCharacters ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-300">
                Loading analytics...
              </div>
            ) : (
              <VisualAnalytics characters={characters} />
            )}
          </div>
        </aside>

        {/* CHAT */}
        <section className="col-span-9 flex h-[82vh] flex-col rounded-3xl border border-white/10 bg-black/20">
          {/* CHAT MESSAGES */}
          <div className="flex-1 overflow-y-auto p-10">
            <div className="mx-auto flex max-w-5xl flex-col gap-8">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`max-w-[78%] rounded-3xl border p-8 ${
                    message.role === "user"
                      ? "ml-auto border-white/10 bg-zinc-100 text-black"
                      : "border-fuchsia-400/20 bg-[#12092f] text-white"
                  }`}
                >
                  <div className="mb-5 flex items-center gap-4">
                    <div
                      className={`h-5 w-5 rounded-full ${
                        message.role === "user"
                          ? "bg-violet-500"
                          : "bg-gradient-to-r from-cyan-300 to-fuchsia-400"
                      }`}
                    />

                    <p className="text-2xl font-black italic">
                      {message.role === "user" ? "You" : "Atlas"}
                    </p>
                  </div>

                  <div
                    className={`whitespace-pre-wrap text-xl leading-relaxed ${
                      message.role === "user" ? "text-black" : "text-slate-100"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="max-w-[78%] rounded-3xl border border-fuchsia-400/20 bg-[#12092f] p-8">
                  <p className="text-xl text-slate-300">
                    Atlas is analyzing the dataset...
                  </p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* INPUT */}
          <div className="border-t border-white/10 bg-[#090313]/90 p-6 backdrop-blur-xl">
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
                className="flex-1 rounded-3xl border border-fuchsia-400/40 bg-zinc-100 px-8 py-6 text-xl text-black outline-none transition focus:border-cyan-300"
              />

              <button
                onClick={sendMessage}
                disabled={loading}
                className="rounded-3xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-10 py-6 text-2xl font-black transition hover:scale-105 disabled:opacity-50"
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