import { BadRequestException } from "@nestjs/common";
import type { FixedCreateBatch } from "@form-copilot/contracts";
import { createHash, randomInt } from "node:crypto";
import type { PlannedBatch } from "./types.js";

// An immediate batch is sequential, but is not an unlimited promise after a prolonged outage.
export const IMMEDIATE_WINDOW_MS = 24 * 60 * 60 * 1_000;

export function planBatch(request: FixedCreateBatch, now = new Date(), random = () => randomInt(0, 0x1_0000_0000) / 0x1_0000_0000): PlannedBatch {
  const start = request.mode === "immediate" ? now.getTime() : Date.parse(request.startAt!);
  const end = request.mode === "immediate" ? start + IMMEDIATE_WINDOW_MS : Date.parse(request.endAt!);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new BadRequestException("Invalid time window");
  if (request.mode === "scheduled" && start < now.getTime()) throw new BadRequestException("Scheduled start time must be in the future");
  return {
    startAt: new Date(start).toISOString(), endAt: new Date(end).toISOString(),
    scheduledAt: Array.from({ length: request.count }, (_, index) => {
      // Stratified jitter randomizes dispatch times without clumping every row into one moment.
      // Only times are randomized. The plan is persisted once inside the idempotent creation transaction.
      const sample = request.mode === "immediate" ? 0 : random();
      if (sample < 0 || sample >= 1 || !Number.isFinite(sample)) throw new Error("Schedule RNG must return a value in [0, 1)");
      const at = request.mode === "immediate" ? start : start + Math.floor(((end - start) * (index + sample)) / request.count);
      return new Date(Math.min(at, end - 1)).toISOString();
    }),
  };
}

export function requestFingerprint(request: FixedCreateBatch): string {
  return createHash("sha256").update(JSON.stringify({
    mode: request.mode, count: request.count, timezone: request.timezone,
    startAt: request.startAt ? new Date(request.startAt).toISOString() : null,
    endAt: request.endAt ? new Date(request.endAt).toISOString() : null,
  })).digest("hex");
}
