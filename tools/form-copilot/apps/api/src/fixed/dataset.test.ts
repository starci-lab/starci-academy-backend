import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { FIXED_FIELDS, loadFixedDataset, validateFixedDataset, validateFixedRow } from "./dataset.js";

const sourceArtifact = async () => JSON.parse(await readFile(new URL("../../data/fixed-dataset.json", import.meta.url), "utf8"));
describe("fixed synthetic dataset", () => {
  it("loads exactly the 519 complete records from the corrected valid CSV", async () => {
    const dataset = await loadFixedDataset();
    expect(dataset.rows).toHaveLength(519);
    expect(new Set(dataset.rows.map((row) => row.id)).size).toBe(519);
    const completing = dataset.rows.filter((row) => Object.keys(row.answers).length === FIXED_FIELDS.length);
    const screened = dataset.rows.filter((row) => Object.keys(row.answers).length < FIXED_FIELDS.length);
    expect(completing).toHaveLength(519);
    expect(screened).toHaveLength(0);
    for (const row of dataset.rows) expect(() => validateFixedRow(row)).not.toThrow();
  });
  it("retains the corrected CSV provenance and valid-only reconciliation", async () => {
    const artifact = await sourceArtifact();
    expect(artifact.synthetic).toBe(true);
    expect(artifact.source.join).toBe("Synthetic_ID");
    expect(artifact.source.sha256).toBe("0e410fc7bafbf13f1dee360ff130d212ed51ee9023bc786f2606872096566905");
    expect(artifact.source.format).toBe("csv");
    expect(artifact.source.derivedScreening).toEqual({ Consent: "1", S0: "1", S1: "1", S2: "1", S3: "1", S4: "1", S5: "0" });
    expect(artifact.reconciliation).toEqual({ sourceCount: 519, completingCount: 519, screenedOutCount: 0, eligibleCount: 519, excludedCount: 0 });
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
  });
});
