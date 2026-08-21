import type { Metadata } from "next";
import Link from "next/link";
import AdminCharacterManager from "@/components/AdminCharacterManager";

export const metadata: Metadata = {
  title: "Administrar datasets",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_92%_5%,rgba(196,187,255,0.3),transparent_27%),linear-gradient(180deg,#fbfbfe_0%,#f1f3fb_100%)] px-5 py-10 sm:px-8 md:px-14 lg:px-20">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="pq-eyebrow">Dataset workspace</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#12152b] sm:text-5xl">
              Administrar datasets
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#646b89] sm:text-base">
              Cadastre personagens e possibilidades sistêmicas sem misturar
              unidades de representação diferentes.
            </p>
          </div>

          <Link
            href="/"
            className="pq-secondary-button w-fit px-5 py-3 text-xs"
          >
            Voltar ao site
          </Link>
        </header>

        <AdminCharacterManager />
      </div>
    </main>
  );
}
