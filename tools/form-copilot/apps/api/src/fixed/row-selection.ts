import { createHash } from "node:crypto";
import type { FixedResponseSelection } from "@form-copilot/contracts";
import { SCREENING_FIELDS, type FixedDatasetRow } from "./dataset.js";

function seededRandom(seed: string): () => number {
  let counter = 0;
  return () => {
    const digest = createHash("sha256").update(`${seed}:${counter++}`).digest();
    return digest.readUInt32BE(0) / 0x1_0000_0000;
  };
}

function shuffled<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex]!, result[index]!];
  }
  return result;
}

export function isScreenedOutRow(row: FixedDatasetRow): boolean {
  return SCREENING_FIELDS.some((key) => row.answers[key] !== undefined && row.answers[key] !== (key === "S5" ? "0" : "1"));
}

export function isInvalidRow(row: FixedDatasetRow): boolean {
  return row.sourceStatus === "INVALID";
}

/**
 * Select whole answer vectors without replacement. Stratification prevents source
 * order from erasing invalid cases; stochastic rounding keeps small batches
 * unbiased while converging to the remaining pool's actual branch distribution.
 */
export function rowsForSelection(rows: readonly FixedDatasetRow[], selection: FixedResponseSelection): FixedDatasetRow[] {
  if (selection === "completing") return rows.filter((row) => !isInvalidRow(row));
  if (selection === "screened_out") return rows.filter(isInvalidRow);
  return [...rows];
}

export function selectRandomRows(rows: readonly FixedDatasetRow[], count: number, seed: string, selection: FixedResponseSelection = "mixed"): FixedDatasetRow[] {
  const eligible = rowsForSelection(rows, selection);
  if (!Number.isSafeInteger(count) || count < 0 || count > eligible.length) throw new RangeError("Requested row count is unavailable");
  if (count === 0) return [];
  const random = seededRandom(seed);
  if (selection !== "mixed") return shuffled(eligible, random).slice(0, count);
  const invalid = eligible.filter(isInvalidRow);
  const valid = eligible.filter((row) => !isInvalidRow(row));
  const exactInvalid = count * invalid.length / eligible.length;
  let invalidCount = Math.floor(exactInvalid) + (random() < exactInvalid % 1 ? 1 : 0);
  invalidCount = Math.min(invalid.length, Math.max(0, invalidCount));
  const completingCount = count - invalidCount;
  if (completingCount > valid.length) {
    invalidCount += completingCount - valid.length;
  }
  return shuffled([
    ...shuffled(invalid, random).slice(0, invalidCount),
    ...shuffled(valid, random).slice(0, count - invalidCount),
  ], random);
}
