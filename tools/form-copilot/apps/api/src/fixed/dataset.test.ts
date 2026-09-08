import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { FIXED_FIELDS, loadFixedDataset, validateFixedDataset, validateFixedRow } from "./dataset.js";

const sourceArtifact = async () => JSON.parse(await readFile(new URL("../../data/fixed-dataset.json", import.meta.url), "utf8"));
describe("fixed synthetic dataset", () => {
  it("loads exactly 519 valid and 103 invalid source records", async () => {
    const dataset = await loadFixedDataset();
    expect(dataset.rows).toHaveLength(622);
    expect(new Set(dataset.rows.map((row) => row.id)).size).toBe(622);
    expect(dataset.rows.filter((row) => row.sourceStatus === "VALID")).toHaveLength(519);
    expect(dataset.rows.filter((row) => row.sourceStatus === "INVALID")).toHaveLength(103);
    expect(dataset.rows.filter((row) => row.sourceStatus === "INVALID" && Object.keys(row.answers).length < FIXED_FIELDS.length)).toHaveLength(96);
    expect(dataset.rows.filter((row) => row.sourceExclusionReason === "Straight-lining")).toHaveLength(7);
    for (const row of dataset.rows) expect(() => validateFixedRow(row)).not.toThrow();
  });
  it("retains both source digests and reconciles the actual row-level data", async () => {
    const artifact = await sourceArtifact();
    expect(artifact.synthetic).toBe(true);
    expect(artifact.source.join).toBe("Synthetic_ID");
    expect(artifact.source.files).toEqual([
      expect.objectContaining({ role: "valid", format: "csv", sha256: "0e410fc7bafbf13f1dee360ff130d212ed51ee9023bc786f2606872096566905" }),
      expect.objectContaining({ role: "invalid", format: "xlsx", sha256: "eb5bcf2f34af9cf8ebfe8bfe4b37d232ad99cde9a81a757f3187d7935a141151" }),
    ]);
    expect(artifact.source.derivedScreening).toEqual({ Consent: "1", S0: "1", S1: "1", S2: "1", S3: "1", S4: "1", S5: "0" });
    expect(artifact.reconciliation).toEqual({ sourceCount: 622, validCount: 519, invalidCount: 103, completingCount: 526, screenedOutCount: 96, qualityControlInvalidCount: 7, runnableCount: 622 });
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
