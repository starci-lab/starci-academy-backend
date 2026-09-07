import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import type { FixedDatasetRow } from "./dataset.js";
import { isScreenedOutRow, selectRandomRows } from "./row-selection.js";

describe("fixed dataset row selection", () => {
  it("samples whole valid records without replacement from the corrected CSV", async () => {
    const artifact = JSON.parse(await readFile(new URL("../../data/fixed-dataset.json", import.meta.url), "utf8")) as { rows: FixedDatasetRow[] };
    const selected = selectRandomRows(artifact.rows, 200, "batch-a");
    expect(selected).toHaveLength(200);
    expect(new Set(selected.map((row) => row.id))).toHaveLength(200);
    expect(selected.filter(isScreenedOutRow)).toHaveLength(0);
    for (const row of selected) expect(artifact.rows.find((source) => source.id === row.id)).toBe(row);
  });

  it("is deterministic for one request and varies ordering between request seeds", () => {
    const rows = Array.from({ length: 20 }, (_, index): FixedDatasetRow => ({
      id: `row-${index}`,
      answers: { Consent: index < 5 ? "0" : "1", S0: "1", S1: "1", S2: "1", S3: "1", S4: "1", S5: "0" },
    }));
    const first = selectRandomRows(rows, 10, "request-1").map((row) => row.id);
    expect(selectRandomRows(rows, 10, "request-1").map((row) => row.id)).toEqual(first);
    expect(selectRandomRows(rows, 10, "request-2").map((row) => row.id)).not.toEqual(first);
    expect(first.map((id) => rows.find((row) => row.id === id)!).filter(isScreenedOutRow)).toHaveLength(3);
    expect(selectRandomRows(rows, 4, "good", "completing").every((row) => !isScreenedOutRow(row))).toBe(true);
    expect(selectRandomRows(rows, 4, "bad", "screened_out").every(isScreenedOutRow)).toBe(true);
  });
});
