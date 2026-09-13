import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { FIXED_FIELDS, FIXED_FORM_EDIT_ID, FIXED_FORM_ID, MATRIX_FIELDS, loadFixedDataset, validateFixedDataset, validateFixedRow } from "./dataset.js";

const sourceArtifact = async () => JSON.parse(await readFile(new URL("../../data/fixed-dataset.json", import.meta.url), "utf8"));
describe("fixed synthetic dataset", () => {
  it("loads all 639 source records without inventing answers after a screen-out", async () => {
    const dataset = await loadFixedDataset();
    expect(dataset.rows).toHaveLength(639);
    expect(new Set(dataset.rows.map((row) => row.id)).size).toBe(639);
    expect(dataset.digest).toBe("0b040e996558ca77273e4d794c0ce22a6328eef7a668071e77ab17ce5537c136");
    expect(FIXED_FIELDS).toHaveLength(53);
    expect(MATRIX_FIELDS).toContain("SMM_OVERALL");
    const completing = dataset.rows.filter((row) => Object.keys(row.answers).length === FIXED_FIELDS.length);
    const screened = dataset.rows.filter((row) => Object.keys(row.answers).length < FIXED_FIELDS.length);
    expect(completing).toHaveLength(527);
    expect(screened).toHaveLength(112);
    for (const row of dataset.rows) expect(() => validateFixedRow(row)).not.toThrow();
  });
  it("preserves valid IDs and assigns deterministic invalid IDs in merged-row order", async () => {
    const artifact = await sourceArtifact();
    expect(artifact.synthetic).toBe(true);
    expect(artifact.source.join).toBe("merged Excel row");
    expect(artifact.source.sha256).toBe("a569369f211e06053ca74a8e08c56a9891a5bf086cc933e9a399b5ff6f12040a");
    expect(artifact.reconciliation).toEqual({ sourceCount: 639, validCount: 519, invalidCount: 120, completingPathCount: 527, earlyCloseCount: 112, qualityControlInvalidCount: 8, runnableCount: 639, preservedValidIds: 519, generatedInvalidIds: 120 });
    const validIds = artifact.rows.filter((row: { sourceStatus: string }) => row.sourceStatus === "VALID").map((row: { id: string }) => row.id);
    const invalidRows = artifact.rows.filter((row: { sourceStatus: string }) => row.sourceStatus === "INVALID");
    const invalidIds = invalidRows.map((row: { id: string }) => row.id);
    expect(validIds).toHaveLength(519);
    expect(validIds.every((id: string) => /^SYN-V\d{3}$/.test(id))).toBe(true);
    expect(invalidIds).toEqual(Array.from({ length: 120 }, (_, index) => `SYN-I${String(index + 1).padStart(3, "0")}`));
    expect(invalidRows.filter((row: { answers: Record<string, string> }) => Object.keys(row.answers).length < FIXED_FIELDS.length)).toHaveLength(112);
    expect(invalidRows.filter((row: { sourceExclusionReason: string }) => row.sourceExclusionReason === "QC: straight-line")).toHaveLength(8);
    expect(FIXED_FORM_ID).toBe("1FAIpQLSdTcfJ5fWj2jXUC87OgMLXHDA8eZOB_KoSjmnYRNbUFsixIVg");
    expect(FIXED_FORM_EDIT_ID).toBe("1SUw44N_WBCEiYR4i4O_p0axXl8R1V-f4he4p-HiT0m8");
  });
  it("rejects missing values, duplicate IDs, tampering and stripped synthetic provenance", async () => {
    const artifact = await sourceArtifact();
    const missing = structuredClone(artifact);
    delete missing.rows[0].answers.S0;
    expect(() => validateFixedDataset(missing)).toThrow("screening");
    const duplicate = structuredClone(artifact);
    duplicate.rows[0].id = duplicate.rows[1].id;
    expect(() => validateFixedDataset(duplicate)).toThrow("Duplicate");
    const changed = structuredClone(artifact);
    changed.rows[0].answers.SMC1 = changed.rows[0].answers.SMC1 === "1" ? "2" : "1";
    expect(() => validateFixedDataset(changed)).toThrow("digest");
    artifact.synthetic = false;
    expect(() => validateFixedDataset(artifact)).toThrow("provenance");
  });
  it("accepts a declared screen-out prefix but rejects missing reachable or completing answers", async () => {
    const { rows } = await loadFixedDataset();
    const row = structuredClone(rows.find((candidate) => candidate.sourceStatus === "VALID")!);
    row.answers.Consent = "0";
    for (const key of Object.keys(row.answers)) if (key !== "Consent") delete row.answers[key];
    expect(() => validateFixedRow(row)).not.toThrow();
    delete row.answers.Consent;
    expect(() => validateFixedRow(row)).toThrow("answer keys");
    const complete = structuredClone(rows.find((candidate) => candidate.sourceStatus === "VALID")!);
    complete.answers.SMC1 = "";
    expect(() => validateFixedRow(complete)).toThrow("matrix");
    complete.answers.SMC1 = "3";
    complete.answers.D3_Status = "Both";
    expect(() => validateFixedRow(complete)).toThrow("demographic");
    complete.answers.D3_Status = "Both studying and working";
    complete.answers.Consent = "0";
    expect(() => validateFixedRow(complete)).toThrow("reachable screening prefix");
  });
});
