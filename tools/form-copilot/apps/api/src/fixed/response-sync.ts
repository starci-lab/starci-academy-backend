import { createHash } from "node:crypto";
import { parse } from "csv-parse/sync";

export const FIXED_RESPONSE_SOURCE_KEY = "google-form:18jAiCr6Q7bz6sQA5kH1SW53aPW6L_jzzp8m8UgJkPIk";
export const FIXED_RESPONSE_CSV_URL = "https://docs.google.com/spreadsheets/d/1vQQzBLe22K92IROjnoYfqrEHgHeAH14HDQb9UPHUSiI/export?format=csv&gid=57238434";
export const FIXED_RESPONSE_COLUMN_COUNT = 53;
export const FIXED_RESPONSE_HEADER_DIGEST = "a1706b59dcbd27f5892c17f851fff06c0b5f88436b0c0630f36a46e67471a6f1";
const MAX_CSV_BYTES = 8 * 1024 * 1024;

export interface FixedResponseRow {
  rowNumber: number;
  submittedAtText: string;
  values: string[];
  digest: string;
}

export interface FixedResponseSnapshot {
  sourceKey: string;
  sourceUrl: string;
  headers: string[];
  rows: FixedResponseRow[];
  digest: string;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

interface ResponseCsvContract { columnCount: number; headerDigest: string }

export function parseFixedResponseCsv(
  csv: string,
  sourceUrl = FIXED_RESPONSE_CSV_URL,
  contract: ResponseCsvContract = { columnCount: FIXED_RESPONSE_COLUMN_COUNT, headerDigest: FIXED_RESPONSE_HEADER_DIGEST },
): FixedResponseSnapshot {
  if (Buffer.byteLength(csv, "utf8") > MAX_CSV_BYTES) throw new Error("Response CSV exceeds the 8 MiB safety limit");
  const records = parse(csv, {
    bom: true,
    relax_column_count: false,
    skip_empty_lines: false,
    cast: false,
  }) as string[][];
  if (!records.length) throw new Error("Response CSV has no header row");
  const headers = records[0]!;
  const values = records.slice(1);
  if (headers.length !== contract.columnCount) throw new Error(`Response CSV contract changed: expected ${contract.columnCount} columns, received ${headers.length}`);
  if (sha256(JSON.stringify(headers)) !== contract.headerDigest) throw new Error("Response CSV header contract changed");
  const rows = values.map((row, index): FixedResponseRow => {
    if (row.length !== headers.length) throw new Error(`Response CSV row ${index + 2} has ${row.length} columns; expected ${headers.length}`);
    if (!row[0]?.trim()) throw new Error(`Response CSV row ${index + 2} has no submission timestamp`);
    return { rowNumber: index + 1, submittedAtText: row[0], values: row, digest: sha256(JSON.stringify(row)) };
  });
  return {
    sourceKey: FIXED_RESPONSE_SOURCE_KEY,
    sourceUrl,
    headers,
    rows,
    digest: sha256(JSON.stringify(rows.map((row) => row.values))),
  };
}

export async function loadFixedResponseSnapshot(): Promise<FixedResponseSnapshot> {
  const sourceUrl = process.env.FORM_COPILOT_RESPONSE_CSV_URL?.trim() || FIXED_RESPONSE_CSV_URL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  timeout.unref();
  try {
    const response = await fetch(sourceUrl, { signal: controller.signal, redirect: "follow" });
    if (!response.ok) throw new Error(`Response CSV returned HTTP ${response.status}`);
    const length = Number(response.headers.get("content-length") ?? "0");
    if (length > MAX_CSV_BYTES) throw new Error("Response CSV exceeds the 8 MiB safety limit");
    return parseFixedResponseCsv(await response.text(), sourceUrl);
  } finally {
    clearTimeout(timeout);
  }
}
