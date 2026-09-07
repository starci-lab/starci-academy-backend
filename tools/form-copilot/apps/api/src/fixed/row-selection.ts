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

/**
 * Select whole answer vectors without replacement. Stratification prevents source
 * order from erasing early-close cases; stochastic rounding keeps small batches
 * unbiased while converging to the remaining pool's actual branch distribution.
 */
export function rowsForSelection(rows: readonly FixedDatasetRow[], selection: FixedResponseSelection): FixedDatasetRow[] {
  if (selection === "completing") return rows.filter((row) => !isScreenedOutRow(row));
  if (selection === "screened_out") return rows.filter(isScreenedOutRow);
  return [...rows];
}

export function selectRandomRows(rows: readonly FixedDatasetRow[], count: number, seed: string, selection: FixedResponseSelection = "mixed"): FixedDatasetRow[] {
  const eligible = rowsForSelection(rows, selection);
  if (!Number.isSafeInteger(count) || count < 0 || count > eligible.length) throw new RangeError("Requested row count is unavailable");
  if (count === 0) return [];
  const random = seededRandom(seed);
  if (selection !== "mixed") return shuffled(eligible, random).slice(0, count);
  const screened = eligible.filter(isScreenedOutRow);
  const completing = eligible.filter((row) => !isScreenedOutRow(row));
  const exactScreened = count * screened.length / eligible.length;
  let screenedCount = Math.floor(exactScreened) + (random() < exactScreened % 1 ? 1 : 0);
  screenedCount = Math.min(screened.length, Math.max(0, screenedCount));
  const completingCount = count - screenedCount;
  if (completingCount > completing.length) {
    screenedCount += completingCount - completing.length;
  }
  return shuffled([
    ...shuffled(screened, random).slice(0, screenedCount),
    ...shuffled(completing, random).slice(0, count - screenedCount),
  ], random);
}
