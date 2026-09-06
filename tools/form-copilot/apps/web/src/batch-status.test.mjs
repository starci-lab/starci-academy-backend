import assert from "node:assert/strict";
import test from "node:test";
import { batchDisplayStatus } from "./batch-status.ts";

const now = Date.parse("2030-01-01T12:00:00Z");
const batch = {
  status: "running", startAt: "2030-01-01T13:00:00Z",
  counts: { pending: 3, running: 0, succeeded: 0, screened_out: 0, failed: 0, uncertain: 0, cancelled: 0, expired: 0 },
};

test("future pending queue displays scheduled, not processing", () => {
  assert.equal(batchDisplayStatus(batch, now), "scheduled");
});

test("due or immediate pending queue displays waiting, not processing", () => {
  assert.equal(batchDisplayStatus({ ...batch, startAt: "2030-01-01T12:00:00Z" }, now), "pending");
  assert.equal(batchDisplayStatus({ ...batch, startAt: "2030-01-01T11:00:00Z" }, now), "pending");
});

test("processing requires at least one running job", () => {
  assert.equal(batchDisplayStatus({ ...batch, counts: { ...batch.counts, running: 1 } }, now), "running");
  assert.equal(batchDisplayStatus({ ...batch, counts: { ...batch.counts, pending: 0 } }, now), "pending");
});

test("paused and terminal batch states remain visible", () => {
  for (const status of ["paused", "completed", "attention", "cancelled"]) {
    assert.equal(batchDisplayStatus({ ...batch, status }, now), status);
  }
});
