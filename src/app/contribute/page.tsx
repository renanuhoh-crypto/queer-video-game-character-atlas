import ContributionForm from "@/components/ContributionForm";
import PrismPageHero from "@/components/PrismPageHero";

const PANEL =
  "relative overflow-hidden border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.025)_48%,rgba(34,211,238,0.055))] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-7";

const guidelines = [
  {
    title: "Send evidence",
    text: "Include a source, scene, dialogue reference, official profile, transcript, or article that helps verify the character entry.",
  },
  {
    title: "Avoid guessing",
    text: "If an identity field is not confirmed, mark it as unknown or explain the ambiguity instead of treating interpretation as fact.",
  },
  {
    title: "Review first",
    text: "PRSM v1.0 is still a beta dataset, so suggested characters should be reviewed before they become public archive entries.",
  },
  {
    title: "Credit images",
    text: "If you suggest an image, include the original source and credit. PRSM should prefer contextual screenshots, official material, or clearly cited source images over uncited uploads.",
  },
];

export default function ContributePage() {
  return (
    <main className="min-h-screen bg-[#020207] text-white">
      <PrismPageHero
        eyebrow="Open dataset"
        title="Contribute"
        accent="Characters"
        description="Suggest queer video game characters for future PRSM review. During beta v1.0, contributions are treated as research leads while the dataset is still being populated."
      />

      <section className="relative px-5 py-12 sm:px-8 md:px-14 md:py-16 lg:px-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(217,70,239,0.12),transparent_30%),radial-gradient(circle_at_88%_14%,rgba(34,211,238,0.1),transparent_28%)]" />

        <div className="relative z-10 mx-auto grid max-w-[1500px] gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="space-y-6">
            <section className={PANEL}>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-fuchsia-300 sm:text-xs sm:tracking-[0.34em]">
                Beta workflow
              </p>
              <h2 className="mt-4 text-2xl font-black italic text-white sm:text-3xl">
                This page prepares a submission draft.
              </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg">
                The current version does not publish submissions automatically.
                It helps contributors organize character details so the entry
                can be reviewed before being added to the dataset.
              </p>
              <p className="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg">
                For images, PRSM should treat copyrighted material as research
                context: credited, cited, nonprofit, and limited to what is
                needed for educational analysis.
              </p>
            </section>

            {guidelines.map((guideline) => (
              <section key={guideline.title} className={PANEL}>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-300 sm:text-xs sm:tracking-[0.34em]">
                  Guideline
                </p>
                <h3 className="mt-4 text-xl font-black italic text-white sm:text-2xl">
                  {guideline.title}
                </h3>
                <p className="mt-4 leading-relaxed text-slate-300">
                  {guideline.text}
                </p>
              </section>
            ))}
          </aside>

          <section className={PANEL}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-yellow-200" />
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-300 sm:text-xs sm:tracking-[0.34em]">
              Character suggestion
            </p>
            <h2 className="mt-4 text-2xl font-black italic text-white sm:text-3xl">
              Build a contribution draft
            </h2>
            <p className="mt-4 max-w-3xl leading-relaxed text-slate-300">
              Add what you know. Empty fields can stay blank, but evidence and
              context make the suggestion much easier to review.
            </p>

            <div className="mt-8">
              <ContributionForm />
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
