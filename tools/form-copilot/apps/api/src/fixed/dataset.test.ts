import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { FIXED_FIELDS, loadFixedDataset, validateFixedDataset, validateFixedRow } from "./dataset.js";

const sourceArtifact = async () => JSON.parse(await readFile(new URL("../../data/fixed-dataset.json", import.meta.url), "utf8"));
describe("fixed synthetic dataset", () => {
  it("loads all 637 source records without inventing answers after a screen-out", async () => {
    const dataset = await loadFixedDataset();
    expect(dataset.rows).toHaveLength(637);
    expect(new Set(dataset.rows.map((row) => row.id)).size).toBe(637);
    expect(dataset.digest).toBe("6955d1008ff3bf169b5ada24f334ab135c11ccf191d38af9740061078e66141a");
    const completing = dataset.rows.filter((row) => Object.keys(row.answers).length === FIXED_FIELDS.length);
    const screened = dataset.rows.filter((row) => Object.keys(row.answers).length < FIXED_FIELDS.length);
    expect(completing).toHaveLength(542);
    expect(screened).toHaveLength(95);
    for (const row of dataset.rows) expect(() => validateFixedRow(row)).not.toThrow();
  });
  it("retains the ID-join reconciliation and source workbook fingerprint", async () => {
    const artifact = await sourceArtifact();
    expect(artifact.synthetic).toBe(true);
    expect(artifact.source.join).toBe("Synthetic_ID");
    expect(artifact.source.sha256).toBe("12722bdf55f7c4c22d5f8c5881d16bcdc03bb18d0a3a77892fcb26f241e2f729");
    expect(artifact.reconciliation).toEqual({ rawCount: 637, completingCount: 542, screenedOutCount: 95, qualityExcludedCount: 23, eligibleCount: 519, excludedCount: 118, mismatchedSharedCells: 0, differentFilteredRowPositions: 518 });
    expect(artifact.source.sourceLabels).toHaveLength(3);
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
