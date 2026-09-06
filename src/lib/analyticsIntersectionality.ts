type IntersectionalityRecord = {
  intersectionality?: string[];
  intersectionality_present?: string;
  intersectionality_details?: string;
};

function normalize(value?: string | null) {
  return (
    value
      ?.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "") || ""
  );
}

function splitValues(value?: string | null) {
  if (!value) return [];
  return value
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getIntersectionalityMarkers(record: IntersectionalityRecord) {
  const raw = [
    ...(record.intersectionality || []),
    ...splitValues(record.intersectionality_present),
  ];
  const normalized = raw.map(normalize).filter(Boolean);
  const detailText = normalize(record.intersectionality_details);
  const evidenceText = [...normalized, detailText].filter(Boolean).join("_");
  const markers = new Set<string>();

  if (
    /race|ethnic|person_of_color|black|asian|indigenous|two_spirit|mexican_american/.test(
      evidenceText,
    )
  ) {
    markers.add("race_ethnicity");
  }
  if (/person_of_color/.test(evidenceText)) markers.add("person_of_color");
  if (
    /nationality|migration|migrant|diaspora|citizenship|border|mexican_american|french/.test(
      evidenceText,
    )
  ) {
    markers.add("nationality_migration");
  }
  if (/religion|religious|faith/.test(evidenceText)) markers.add("religion");
  if (/class|socio_economic|poverty|wealth|nobleman|labor/.test(evidenceText)) {
    markers.add("class");
  }
  if (/disability|disabled|chronic_illness|neurodiverg/.test(evidenceText)) {
    markers.add("disability");
  }
  if (normalized.includes("age")) markers.add("age");
  if (normalized.includes("other")) markers.add("other_axis");

  if (markers.size) return Array.from(markers);
  if (
    normalized.includes("no") ||
    ["none", "none_documented", "no_details_about_his_background"].includes(
      detailText,
    )
  ) {
    return ["none_documented"];
  }
  if (normalized.includes("yes") || normalized.some((value) => value !== "unknown")) {
    return ["documented_unspecified"];
  }
  return ["not_recorded"];
}

export function getEthnicityMarkers(record: IntersectionalityRecord) {
  const evidenceText = normalize(
    [
      ...(record.intersectionality || []),
      record.intersectionality_present,
      record.intersectionality_details,
    ]
      .filter(Boolean)
      .join("; "),
  );
  const paddedEvidence = `_${evidenceText}_`;
  const markers = new Set<string>();
  const includes = (term: string) =>
    paddedEvidence.includes(`_${term}_`);

  const compoundMarkers = [
    "mexican_american",
    "african_american",
    "asian_american",
    "afro_latino",
  ];
  compoundMarkers.forEach((marker) => {
    if (includes(marker)) markers.add(marker);
  });

  [
    "black",
    "asian",
    "indigenous",
    "mexican",
    "african",
    "indian",
    "arab",
    "latino",
    "latina",
    "latine",
    "latinx",
    "hispanic",
    "romani",
  ].forEach((marker) => {
    if (includes(marker)) markers.add(marker);
  });

  if (markers.has("mexican_american")) markers.delete("mexican");
  if (markers.has("african_american")) markers.delete("african");
  if (markers.has("asian_american")) markers.delete("asian");

  return Array.from(markers);
}
