"use client";

import { useEffect, useRef, useState } from "react";
import VisualAnalytics from "@/components/VisualAnalytics";

type Character = {
  character_name: string;
  game_title: string;
  developer: string;
  identity_category: string[];
  identity_label: string[];
  playable: boolean;
  intersectionality: string[];
  description: string;
  character_image?: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  character?: Character | null;
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
          character: data.character,
        },
      ]);
    } catch (error) {
      console.error(error);

      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: "Error connecting to Atlas.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative h-screen overflow-hidden bg-[#07071a] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,#7c3aed55,transparent_35%),radial-gradient(circle_at_bottom_right,#ec489955,transparent_30%),linear-gradient(180deg,#07071a,#020617)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-20 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:48px_48px]" />

      <header className="h-[120px] border-b border-white/10 bg-white/[0.03] backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.35em] text-cyan-300">
              AI-Assisted Archive
            </p>

            <h1 className="text-3xl font-black italic tracking-tight md:text-5xl">
              Queer Video Game{" "}
              <span className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">
                Character Atlas
              </span>
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-300 md:text-base">
              Explore queer characters, games, identities, intersectionality,
              and representation through a living research dataset.
            </p>
          </div>

          <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-right md:block">
            <p className="text-xs uppercase tracking-widest text-slate-400">
              Dataset mode
            </p>
            <p className="mt-1 font-bold text-fuchsia-300">Prototype v1.0</p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid h-[calc(100vh-120px)] max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[360px_1fr]">
        <aside className="hidden h-full overflow-y-auto rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl lg:block">
          <h2 className="text-lg font-bold italic">Archive Tools</h2>

          <div className="mt-5 space-y-3">
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
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm text-slate-200 transition hover:border-fuchsia-400/60 hover:bg-fuchsia-400/10"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
            <p className="text-xs uppercase tracking-widest text-cyan-200">
              Suggested prompt
            </p>
            <p className="mt-2 text-sm text-slate-200">
              Compare Ellie and Lev in terms of identity, role, and
              representation.
            </p>
          </div>

          <div className="mt-8">
            {loadingCharacters ? (
  <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
    Loading analytics...
  </div>
) : (
  <div className="mt-8">
    <VisualAnalytics characters={characters} />
  </div>
)}
          </div>
        </aside>

        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 scroll-smooth md:p-8">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-3xl rounded-3xl p-5 shadow-2xl ${
                    message.role === "assistant"
                      ? "border border-violet-300/20 bg-[#0d0b35]/90"
                      : "bg-[#f1eee8] text-black"
                  }`}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        message.role === "assistant"
                          ? "bg-gradient-to-r from-fuchsia-400 to-cyan-300"
                          : "bg-violet-500"
                      }`}
                    />

                    <h2 className="text-xl font-black italic">
                      {message.role === "assistant" ? "Atlas" : "You"}
                    </h2>
                  </div>

                  <p className="whitespace-pre-wrap text-base leading-8 md:text-lg">
                    {message.content}
                  </p>

                  {message.character && (
                    <CharacterCard character={message.character} />
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="max-w-3xl rounded-3xl border border-violet-300/20 bg-[#0d0b35]/90 p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="h-3 w-3 animate-pulse rounded-full bg-gradient-to-r from-fuchsia-400 to-cyan-300" />
                    <h2 className="text-xl font-black italic">Atlas</h2>
                  </div>

                  <p className="animate-pulse text-slate-300">
                    Searching the archive...
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 border-t border-white/10 bg-[#07071a]/90 p-4 backdrop-blur-xl">
            <div className="mx-auto flex max-w-4xl gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                placeholder="Ask Atlas about queer game characters..."
                className="flex-1 rounded-2xl border border-violet-300/30 bg-white/90 px-5 py-4 text-black outline-none transition placeholder:text-slate-500 focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-400/20"
              />

              <button
                onClick={sendMessage}
                disabled={loading}
                className="rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-7 font-black transition hover:scale-105 disabled:opacity-50"
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

function CharacterCard({ character }: { character: Character }) {
  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-fuchsia-300/20 bg-white/[0.04]">
      {character.character_image && (
        <img
          src={character.character_image}
          alt={character.character_name}
          className="h-56 w-full object-cover"
        />
      )}

      <div className="p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
          Character Record
        </p>

        <h3 className="mt-2 text-3xl font-black italic">
          {character.character_name}
        </h3>

        <p className="mt-1 text-sm text-slate-300">
          {character.game_title} · {character.developer}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {character.identity_label.map((label) => (
            <span
              key={label}
              className="rounded-full border border-fuchsia-300/30 bg-fuchsia-400/10 px-3 py-1 text-xs font-bold text-fuchsia-200"
            >
              {formatLabel(label)}
            </span>
          ))}

          <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">
            {character.playable ? "Playable" : "Non-playable"}
          </span>
        </div>

        <p className="mt-4 text-sm leading-7 text-slate-200">
          {character.description}
        </p>

        {character.intersectionality?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-widest text-slate-400">
              Intersectionality
            </p>

            <p className="mt-1 text-sm text-slate-200">
              {character.intersectionality.map(formatLabel).join(", ")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}