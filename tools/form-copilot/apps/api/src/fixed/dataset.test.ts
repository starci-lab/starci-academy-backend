import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { FIXED_FIELDS, loadFixedDataset, validateFixedDataset, validateFixedRow } from "./dataset.js";

const sourceArtifact = async () => JSON.parse(await readFile(new URL("../../data/fixed-dataset.json", import.meta.url), "utf8"));
describe("fixed synthetic dataset", () => {
  it("loads 519 unique eligible records, each with exactly 52 preserved answers", async () => {
    const dataset = await loadFixedDataset();
    expect(dataset.rows).toHaveLength(519);
    expect(new Set(dataset.rows.map((row) => row.id)).size).toBe(519);
    expect(dataset.digest).toBe("909e30bf2593cca13c3f14cc03e6800f0b955606f8826719a66685f8082adb5e");
    for (const row of dataset.rows) {
      expect(Object.keys(row.answers).sort()).toEqual([...FIXED_FIELDS].sort());
      expect(row.answers.S5).toBe("0");
      expect(() => validateFixedRow(row)).not.toThrow();
    }
  });
  it("retains the ID-join reconciliation and source workbook fingerprint", async () => {
    const artifact = await sourceArtifact();
    expect(artifact.synthetic).toBe(true);
    expect(artifact.source.join).toBe("Synthetic_ID");
    expect(artifact.source.sha256).toBe("12722bdf55f7c4c22d5f8c5881d16bcdc03bb18d0a3a77892fcb26f241e2f729");
    expect(artifact.reconciliation).toEqual({ rawCount: 637, eligibleCount: 519, excludedCount: 118, mismatchedSharedCells: 0, differentFilteredRowPositions: 518 });
    expect(artifact.source.sourceLabels).toHaveLength(3);
  });
  it("rejects missing values, duplicate IDs, tampering and stripped synthetic provenance", async () => {
    const artifact = await sourceArtifact();
    const missing = structuredClone(artifact);
    delete missing.rows[0].answers.S0;
    expect(() => validateFixedDataset(missing)).toThrow("52");
    const duplicate = structuredClone(artifact);
    duplicate.rows[0].id = duplicate.rows[1].id;
    expect(() => validateFixedDataset(duplicate)).toThrow("Duplicate");
    const changed = structuredClone(artifact);
    changed.rows[0].answers.SMC1 = changed.rows[0].answers.SMC1 === "1" ? "2" : "1";
    expect(() => validateFixedDataset(changed)).toThrow("digest");
    artifact.synthetic = false;
    expect(() => validateFixedDataset(artifact)).toThrow("provenance");
  });
  it("rejects excluded screening and does not turn missing responses into plausible values", async () => {
    const { rows } = await loadFixedDataset();
    const row = structuredClone(rows[0]!);
    row.answers.Consent = "0";
    expect(() => validateFixedRow(row)).toThrow("screening");
    row.answers.Consent = "1";
    row.answers.SMC1 = "";
    expect(() => validateFixedRow(row)).toThrow("matrix");
    row.answers.SMC1 = "3";
    row.answers.D3_Status = "Both";
    expect(() => validateFixedRow(row)).toThrow("demographic");
  });
});
