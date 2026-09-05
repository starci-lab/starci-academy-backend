import { describe, expect, it } from "vitest";
import type { FormField } from "@form-copilot/contracts";
import { batchSafeSyntheticPlan, executeSyntheticPlan, generateDistributionProposals, generateSyntheticSchedule, sampleSeededNormal } from "./distribution.js";

const field: FormField = { id: "age", name: "age", kind: "number", label: "Tuổi", description: "", section: "", required: true, multiple: false, min: 18, max: 65, step: 1, options: [] };

describe("seeded distributions", () => {
  it("is deterministic and clamps the value to field constraints", () => {
    const spec = [{ fieldId: "age", kind: "normal" as const, mean: 41, standardDeviation: 100, integer: true }];
    const first = generateDistributionProposals(spec, [field], "same-seed");
    const second = generateDistributionProposals(spec, [field], "same-seed");
    expect(first).toEqual(second);
    expect(Number(first[0]?.value)).toBeGreaterThanOrEqual(18);
    expect(Number(first[0]?.value)).toBeLessThanOrEqual(65);
  });

  it("creates a deterministic bounded latent Likert tendency", () => {
    const first = sampleSeededNormal("respondent-42", 3.7, 0.8, 1, 5);
    const second = sampleSeededNormal("respondent-42", 3.7, 0.8, 1, 5);
    expect(first).toBe(second);
    expect(first).toBeGreaterThanOrEqual(1);
    expect(first).toBeLessThanOrEqual(5);
  });

  it("executes an AI-authored normal-option plan deterministically", () => {
    const likert: FormField = { ...field, id: "q1", kind: "radio", options: [1, 2, 3, 4, 5].map((value) => ({ label: String(value), value: String(value) })) };
    const plan = { summary: "Positive QA persona", rules: [{ fieldId: "q1", strategy: "normal-option" as const, mean: 3.8, standardDeviation: 0.7, group: "attitude", offset: 0, reverse: false, orderedValues: ["1", "2", "3", "4", "5"], rationale: "Prompt asks for a mildly positive respondent" }] };
    expect(executeSyntheticPlan(plan, [likert], "seed-1")).toEqual(executeSyntheticPlan(plan, [likert], "seed-1"));
    expect(["1", "2", "3", "4", "5"]).toContain(executeSyntheticPlan(plan, [likert], "seed-1")[0]?.value);
  });

  it("maps high scores through semantic order instead of DOM order", () => {
    const likert: FormField = { ...field, id: "satisfaction", kind: "radio", options: ["Rất hài lòng", "Hài lòng", "Bình thường"].map((value) => ({ label: value, value })) };
    const plan = { summary: "High satisfaction", rules: [{ fieldId: "satisfaction", strategy: "normal-option" as const, mean: 3, standardDeviation: 0.01, group: "satisfaction", offset: 0, reverse: false, orderedValues: ["Bình thường", "Hài lòng", "Rất hài lòng"], rationale: "High means semantically satisfied" }] };
    expect(executeSyntheticPlan(plan, [likert], "seed-high")[0]?.value).toBe("Rất hài lòng");
  });

  it("creates a deterministic chronological schedule inside the requested range", () => {
    const first = generateSyntheticSchedule("batch-42", "2026-09-01T00:00:00.000Z", "2026-09-30T23:59:59.000Z", 100, 400);
    const second = generateSyntheticSchedule("batch-42", "2026-09-01T00:00:00.000Z", "2026-09-30T23:59:59.000Z", 100, 400);
    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThanOrEqual(100);
    expect(first.length).toBeLessThanOrEqual(400);
    expect(first.every((row) => row.scheduledAt >= "2026-09-01T00:00:00.000Z" && row.scheduledAt <= "2026-09-30T23:59:59.000Z")).toBe(true);
    expect(first.map((row) => row.scheduledAt)).toEqual(first.map((row) => row.scheduledAt).sort());
  });

  it("removes fixed and omitted rules from batch generation", () => {
    const plan = { summary: "batch", rules: [
      { fieldId: "city", strategy: "categorical" as const, weights: { DN: 1 }, rationale: "weighted" },
      { fieldId: "age", strategy: "constant" as const, value: "30", rationale: "default" },
      { fieldId: "name", strategy: "omit" as const, rationale: "not requested" },
    ] };
    expect(batchSafeSyntheticPlan(plan).rules.map((rule) => rule.fieldId)).toEqual(["city"]);
  });
});
