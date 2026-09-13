import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export const FIXED_FORM_ID = "1FAIpQLSdTcfJ5fWj2jXUC87OgMLXHDA8eZOB_KoSjmnYRNbUFsixIVg";
export const FIXED_FORM_EDIT_ID = "1SUw44N_WBCEiYR4i4O_p0axXl8R1V-f4he4p-HiT0m8";
export const FIXED_FORM_URL = `https://docs.google.com/forms/d/e/${FIXED_FORM_ID}/viewform`;
export const FIXED_FORM_TITLE = "Khảo sát StarCi Academy - Social Media Marketing, Brand Trust & Enrollment Intention";
export const SCREENING_FIELDS = ["Consent", "S0", "S1", "S2", "S3", "S4", "S5"] as const;
export const MATRIX_FIELDS = [
  ...[1, 2, 3, 4].map((number) => `SMC${number}`),
  ...[1, 2, 3].map((number) => `ENT${number}`),
  ...[1, 2, 3, 4].map((number) => `INF${number}`),
  ...[1, 2, 3].map((number) => `INT${number}`),
  ...[1, 2, 3, 4].map((number) => `CRE${number}`),
  "SMM_OVERALL",
  ...["BT", "EI", "OPT", "INN", "DIS", "INS"].flatMap((prefix) => [1, 2, 3, 4].map((number) => `${prefix}${number}`)),
];
export const DEMOGRAPHIC_VALUES: Record<string, readonly string[]> = {
  D1_Age: ["18-22", "23-27", "28-34", "35+"],
  D2_Gender: ["Female", "Male", "Other", "Prefer not to say"],
  D3_Status: ["Student", "Working", "Both studying and working", "Other"],
};
export const FIXED_FIELDS = [...SCREENING_FIELDS, ...MATRIX_FIELDS, ...Object.keys(DEMOGRAPHIC_VALUES)];
export interface FixedDatasetRow {
  id: string;
  answers: Record<string, string>;
  sourceStatus?: string;
  sourceExclusionReason?: string | null;
}
export interface FixedDataset { name: string; digest: string; rows: FixedDatasetRow[] }

export function validateFixedRow(row: FixedDatasetRow): void {
  if (!row || typeof row.id !== "string" || !row.id.trim() || !row.answers || typeof row.answers !== "object") throw new Error("Invalid synthetic dataset row");
  const keys = Object.keys(row.answers);
  if (!keys.length || keys.some((key) => !FIXED_FIELDS.includes(key))) throw new Error("Dataset contains unsupported or missing answer keys");
  let screenedOutAt = -1;
  for (const [index, key] of SCREENING_FIELDS.entries()) {
    const value = row.answers[key];
    if (value === undefined) throw new Error(`Missing reachable screening answer: ${key}`);
    if (!/^[01]$/.test(value)) throw new Error(`Invalid screening answer: ${key}`);
    if (value !== (key === "S5" ? "0" : "1")) { screenedOutAt = index; break; }
  }
  for (const key of MATRIX_FIELDS) {
    const value = row.answers[key];
    if (value !== undefined && !/^[1-5]$/.test(value)) throw new Error(`Invalid matrix answer: ${key}`);
  }
  for (const [key, values] of Object.entries(DEMOGRAPHIC_VALUES)) {
    const value = row.answers[key];
    if (value !== undefined && !values.includes(value)) throw new Error(`Invalid demographic answer: ${key}`);
  }
  if (screenedOutAt >= 0) {
    const reachable = SCREENING_FIELDS.slice(0, screenedOutAt + 1);
    if (keys.length !== reachable.length || keys.some((key) => !reachable.includes(key as typeof reachable[number]))) {
      throw new Error("A screened-out response must contain only its reachable screening prefix");
    }
  } else if (keys.length !== FIXED_FIELDS.length || FIXED_FIELDS.some((key) => !Object.hasOwn(row.answers, key))) {
    throw new Error(`A completing response must contain exactly ${FIXED_FIELDS.length} supported answers`);
  }
}

/** Validate the generated source artifact on every load; never repair missing values. */
export function validateFixedDataset(value: unknown): FixedDataset {
  if (!value || typeof value !== "object") throw new Error("Fixed dataset is missing");
  const artifact = value as Record<string, unknown>;
  const source = artifact.source as Record<string, unknown> | undefined;
  const reconciliation = artifact.reconciliation as Record<string, unknown> | undefined;
  if (artifact.schemaVersion !== 5 || artifact.synthetic !== true || typeof artifact.label !== "string" || !/synthetic rehearsal/i.test(artifact.label) ||
    typeof artifact.name !== "string" || !source || source.join !== "merged Excel row" || source.invalidIdStrategy !== "SYN-I + 3-digit invalid ordinal in merged-row order" ||
    typeof source.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(source.sha256)) {
    throw new Error("Fixed dataset synthetic provenance is invalid");
  }
  if (!Array.isArray(artifact.rows) || artifact.rows.length !== 639) throw new Error("Fixed dataset must contain all 639 source rows");
  const rows = artifact.rows as FixedDatasetRow[];
  const seen = new Set<string>();
  let validCount = 0;
  let invalidCount = 0;
  let screenedOutCount = 0;
  let qualityExcludedCount = 0;
  for (const row of rows) {
    validateFixedRow(row);
    if (seen.has(row.id)) throw new Error("Duplicate Synthetic_ID in fixed dataset");
    seen.add(row.id);
    if (row.sourceStatus === "VALID") {
      if (!/^SYN-V\d{3}$/.test(row.id) || row.sourceExclusionReason !== null) throw new Error("Valid source row identity is invalid");
      validCount++;
    } else if (row.sourceStatus === "INVALID") {
      invalidCount++;
      if (row.id !== `SYN-I${String(invalidCount).padStart(3, "0")}` || typeof row.sourceExclusionReason !== "string" || !row.sourceExclusionReason) {
        throw new Error("Deterministic invalid source row identity is invalid");
      }
      if (/^Screening: (?:Consent|S[0-5])$/.test(row.sourceExclusionReason)) {
        screenedOutCount++;
      } else if (row.sourceExclusionReason === "QC: straight-line") {
        qualityExcludedCount++;
      } else {
        throw new Error("Invalid source exclusion reason is invalid");
      }
    } else {
      throw new Error("Fixed dataset source status is invalid");
    }
  }
  if (validCount !== 519 || invalidCount !== 120 || screenedOutCount !== 112 || qualityExcludedCount !== 8 || !reconciliation ||
    reconciliation.sourceCount !== 639 || reconciliation.completingPathCount !== 527 || reconciliation.earlyCloseCount !== 112 ||
    reconciliation.qualityControlInvalidCount !== 8 || reconciliation.validCount !== 519 || reconciliation.invalidCount !== 120 || reconciliation.runnableCount !== 639 ||
    reconciliation.preservedValidIds !== 519 || reconciliation.generatedInvalidIds !== 120) {
    throw new Error("Fixed dataset classification counts are invalid");
  }
  const digest = createHash("sha256").update(JSON.stringify(rows)).digest("hex");
  if (artifact.digest !== digest) throw new Error("Fixed dataset digest mismatch");
  return { name: artifact.name, digest, rows };
}

export async function loadFixedDataset(): Promise<FixedDataset> {
  return validateFixedDataset(JSON.parse(await readFile(new URL("../../data/fixed-dataset.json", import.meta.url), "utf8")));
}
