import type { FixedBatch } from "./api";

/** The API's `running` batch status means an active queue, not an active job. */
export function batchDisplayStatus(batch: Pick<FixedBatch, "status" | "counts" | "startAt">, now = Date.now()): FixedBatch["status"] {
  if (["paused", "completed", "attention", "cancelled"].includes(batch.status)) return batch.status;
  if (batch.counts.running > 0) return "running";
  if (batch.counts.pending > 0) return Date.parse(batch.startAt) > now ? "scheduled" : "pending";
  // Never claim active processing without an active job, including the short
  // interval before the server reconciles an empty active queue's final state.
  return batch.status === "running" ? "pending" : batch.status;
}
