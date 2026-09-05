import { describe, expect, it } from "vitest";
import { FixedCreateBatchSchema, type FixedCreateBatch } from "@form-copilot/contracts";
import { IMMEDIATE_WINDOW_MS, planBatch, requestFingerprint } from "./planner.js";

const base: FixedCreateBatch = { mode: "immediate", count: 3, timezone: "Asia/Bangkok", requestId: "18a5e536-617b-4c27-a84f-232c9907437d" };
describe("fixed batch input and UTC planning", () => {
  it("validates exact counts, IANA zones and rejects arbitrary URL/AI inputs", () => {
    expect(FixedCreateBatchSchema.safeParse(base).success).toBe(true);
    for (const body of [{ ...base, count: 0 }, { ...base, count: 1.2 }, { ...base, timezone: "Mars/City" }, { ...base, url: "https://example.org" }, { ...base, prompt: "generate" }]) {
      expect(FixedCreateBatchSchema.safeParse(body).success).toBe(false);
    }
  });
  it("requires explicit RFC3339 offsets and ordered scheduled windows", () => {
    const scheduled = { ...base, mode: "scheduled", startAt: "2030-04-01T09:00:00+07:00", endAt: "2030-04-01T10:00:00+07:00" };
    expect(FixedCreateBatchSchema.safeParse(scheduled).success).toBe(true);
    expect(FixedCreateBatchSchema.safeParse({ ...scheduled, startAt: "2030-04-01T09:00" }).success).toBe(false);
    expect(FixedCreateBatchSchema.safeParse({ ...scheduled, endAt: scheduled.startAt }).success).toBe(false);
    expect(FixedCreateBatchSchema.safeParse({ ...scheduled, endAt: undefined }).success).toBe(false);
    expect(FixedCreateBatchSchema.safeParse({ ...base, startAt: scheduled.startAt }).success).toBe(false);
  });
  it("jitters the exact count within UTC strata, keeping the last slot inside the deadline", () => {
    const plan = planBatch({ ...base, mode: "scheduled", startAt: "2030-04-01T09:00:00+07:00", endAt: "2030-04-01T10:00:00+07:00" }, new Date("2030-04-01T00:00:00Z"), () => 0.5);
    expect(plan.scheduledAt).toEqual(["2030-04-01T02:10:00.000Z", "2030-04-01T02:30:00.000Z", "2030-04-01T02:50:00.000Z"]);
    expect(plan.endAt).toBe("2030-04-01T03:00:00.000Z");
  });
  it("keeps adversarial RNG boundaries within the requested window", () => {
    const input: FixedCreateBatch = { ...base, mode: "scheduled", startAt: "2030-04-01T00:00:00Z", endAt: "2030-04-01T00:00:01Z" };
    const samples = [0, 0.999999999, 0.999999999];
    const plan = planBatch(input, new Date("2029-01-01"), () => samples.shift()!);
    expect(plan.scheduledAt).toHaveLength(3);
    for (const value of plan.scheduledAt) {
      expect(Date.parse(value)).toBeGreaterThanOrEqual(Date.parse(input.startAt!));
      expect(Date.parse(value)).toBeLessThan(Date.parse(input.endAt!));
    }
    expect(() => planBatch(input, new Date("2029-01-01"), () => 1)).toThrow("RNG");
  });
  it("sets a bounded 24-hour immediate window without resampling its exact count", () => {
    const now = new Date("2030-04-01T00:00:00Z");
    const plan = planBatch(base, now);
    expect(plan.scheduledAt).toEqual(Array(3).fill(now.toISOString()));
    expect(Date.parse(plan.endAt) - now.getTime()).toBe(IMMEDIATE_WINDOW_MS);
  });
  it("rejects expired/past scheduled starts", () => {
    expect(() => planBatch({ ...base, mode: "scheduled", startAt: "2030-04-01T00:00:00Z", endAt: "2030-04-01T01:00:00Z" }, new Date("2030-04-02T00:00:00Z"))).toThrow("future");
  });
  it("idempotency fingerprints canonicalize equivalent instants and ignore requestId", () => {
    const request: FixedCreateBatch = { ...base, mode: "scheduled", startAt: "2030-04-01T09:00:00+07:00", endAt: "2030-04-01T10:00:00+07:00" };
    expect(requestFingerprint(request)).toBe(requestFingerprint({ ...request, requestId: "other", startAt: "2030-04-01T02:00:00Z", endAt: "2030-04-01T03:00:00Z" }));
    expect(requestFingerprint(request)).not.toBe(requestFingerprint({ ...request, count: 4 }));
  });
});
