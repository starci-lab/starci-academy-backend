import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export const FIXED_FORM_ID = "1OkPUIYodvLyBjLr9lVFeVtHv_RVIzAYhxevcxJozu34";
export const FIXED_FORM_URL = `https://docs.google.com/forms/d/${FIXED_FORM_ID}/viewform`;
export const FIXED_FORM_TITLE = "Khảo sát StarCi Academy - Social Media Marketing, Brand Trust & Enrollment Intention";
export const SCREENING_FIELDS = ["Consent", "S0", "S1", "S2", "S3", "S4", "S5"] as const;
export const MATRIX_FIELDS = [
  ...["SMC", "INF", "CRE", "BT", "EI", "OPT", "INN", "DIS", "INS"].flatMap((prefix) => [1, 2, 3, 4].map((n) => `${prefix}${n}`)),
  ...["ENT", "INT"].flatMap((prefix) => [1, 2, 3].map((n) => `${prefix}${n}`)),
];
export const DEMOGRAPHIC_VALUES: Record<string, readonly string[]> = {
  D1_Age: ["18-22", "23-27", "28-34", "35+"],
  D2_Gender: ["Female", "Male", "Other", "Prefer not to say"],
  D3_Status: ["Student", "Working", "Both studying and working", "Other"],
};
export const FIXED_FIELDS = [...SCREENING_FIELDS, ...MATRIX_FIELDS, ...Object.keys(DEMOGRAPHIC_VALUES)];
export interface FixedDatasetRow { id: string; answers: Record<string, string> }
export interface FixedDataset { name: string; digest: string; rows: FixedDatasetRow[] }

export function validateFixedRow(row: FixedDatasetRow): void {
  if (!row || typeof row.id !== "string" || !row.id.trim() || !row.answers || typeof row.answers !== "object") throw new Error("Invalid synthetic dataset row");
  const keys = Object.keys(row.answers);
  if (keys.length !== 52 || FIXED_FIELDS.some((key) => !Object.hasOwn(row.answers, key))) throw new Error("Dataset must contain exactly 52 supported answers");
  for (const key of SCREENING_FIELDS) if (row.answers[key] !== (key === "S5" ? "0" : "1")) throw new Error(`Ineligible screening answer: ${key}`);
  for (const key of MATRIX_FIELDS) if (typeof row.answers[key] !== "string" || !/^[1-5]$/.test(row.answers[key]!)) throw new Error(`Invalid matrix answer: ${key}`);
  for (const [key, values] of Object.entries(DEMOGRAPHIC_VALUES)) if (!values.includes(row.answers[key]!)) throw new Error(`Invalid demographic answer: ${key}`);
}

/** Validate the generated source artifact on every load; never repair missing values. */
export function validateFixedDataset(value: unknown): FixedDataset {
  if (!value || typeof value !== "object") throw new Error("Fixed dataset is missing");
  const artifact = value as Record<string, unknown>;
  const source = artifact.source as Record<string, unknown> | undefined;
  if (artifact.schemaVersion !== 1 || artifact.synthetic !== true || typeof artifact.label !== "string" || !/synthetic rehearsal/i.test(artifact.label) ||
    typeof artifact.name !== "string" || !source || source.join !== "Synthetic_ID" || typeof source.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(source.sha256)) {
    throw new Error("Fixed dataset synthetic provenance is invalid");
  }
  if (!Array.isArray(artifact.rows) || artifact.rows.length !== 519) throw new Error("Fixed dataset must contain 519 eligible rows");
  const rows = artifact.rows as FixedDatasetRow[];
  const seen = new Set<string>();
  for (const row of rows) {
    validateFixedRow(row);
    if (seen.has(row.id)) throw new Error("Duplicate Synthetic_ID in fixed dataset");
    seen.add(row.id);
  }
  const digest = createHash("sha256").update(JSON.stringify(rows)).digest("hex");
  if (artifact.digest !== digest) throw new Error("Fixed dataset digest mismatch");
  return { name: artifact.name, digest, rows };
}

export async function loadFixedDataset(): Promise<FixedDataset> {
  return validateFixedDataset(JSON.parse(await readFile(new URL("../../data/fixed-dataset.json", import.meta.url), "utf8")));
}
