export type ResearchReferenceId =
  | "lgbtq-archive"
  | "glaad-terms"
  | "data-feminism"
  | "crenshaw-intersectionality"
  | "fair-principles"
  | "nist-ai-rmf"
  | "copyright-fair-use";

export type ResearchReference = {
  id: ResearchReferenceId;
  shortTitle: string;
  citation: string;
  url: string;
  relevance: string;
};

export const RESEARCH_REFERENCES: Record<
  ResearchReferenceId,
  ResearchReference
> = {
  "lgbtq-archive": {
    id: "lgbtq-archive",
    shortTitle: "LGBTQ Video Game Archive",
    citation:
      "Shaw, Adrienne, et al. “About (Please Read First!).” LGBTQ Video Game Archive.",
    url: "https://lgbtqgamearchive.com/about/about-archive/",
    relevance:
      "Supports the distinction between explicitly coded content, creator statements, queer readings, and incomplete research coverage.",
  },
  "glaad-terms": {
    id: "glaad-terms",
    shortTitle: "GLAAD terminology guide",
    citation:
      "GLAAD. “Glossary of Terms.” Where We Are on TV 2023–2024.",
    url: "https://glaad.org/whereweareontv23/glossary-of-terms/",
    relevance:
      "Provides working definitions for terms including bisexual, nonbinary, queer, and transgender while emphasizing respectful, specific language.",
  },
  "data-feminism": {
    id: "data-feminism",
    shortTitle: "Data Feminism",
    citation:
      "D’Ignazio, Catherine, and Lauren F. Klein. Data Feminism. MIT Press, 2020.",
    url: "https://data-feminism.mitpress.mit.edu/",
    relevance:
      "Grounds the project’s attention to power, context, plural perspectives, and the limitations of binaries and apparently neutral classifications.",
  },
  "crenshaw-intersectionality": {
    id: "crenshaw-intersectionality",
    shortTitle: "Crenshaw on intersectionality",
    citation:
      "Crenshaw, Kimberlé. “Demarginalizing the Intersection of Race and Sex.” University of Chicago Legal Forum, 1989.",
    url: "https://chicagounbound.uchicago.edu/uclf/vol1989/iss1/8/",
    relevance:
      "Provides the foundational account of why axes of power and identity cannot always be analyzed as isolated, mutually exclusive categories.",
  },
  "fair-principles": {
    id: "fair-principles",
    shortTitle: "FAIR Guiding Principles",
    citation:
      "Wilkinson, Mark D., et al. “The FAIR Guiding Principles for Scientific Data Management and Stewardship.” Scientific Data 3, 2016.",
    url: "https://www.nature.com/articles/sdata201618",
    relevance:
      "Supports rich metadata, traceability, interoperability, and reuse while making the conditions and provenance of data visible.",
  },
  "nist-ai-rmf": {
    id: "nist-ai-rmf",
    shortTitle: "NIST AI RMF 1.0",
    citation:
      "Tabassi, Elham. Artificial Intelligence Risk Management Framework (AI RMF 1.0). NIST AI 100-1, 2023.",
    url: "https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10",
    relevance:
      "Informs the project’s emphasis on transparent, accountable, explainable, and human-reviewed use of AI-assisted outputs.",
  },
  "copyright-fair-use": {
    id: "copyright-fair-use",
    shortTitle: "U.S. Copyright Office Fair Use Index",
    citation: "U.S. Copyright Office. “Fair Use Index.”",
    url: "https://www.copyright.gov/fair-use/",
    relevance:
      "Explains the four-factor, case-specific framework under Section 107; nonprofit or educational purpose alone does not guarantee fair use.",
  },
};

export function getResearchReferences(ids: ResearchReferenceId[]) {
  return ids.map((id) => RESEARCH_REFERENCES[id]);
}
