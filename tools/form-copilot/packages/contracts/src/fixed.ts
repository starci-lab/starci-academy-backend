import { z } from "zod";

export const FixedBatchModeSchema = z.enum(["immediate", "scheduled"]);
export const FixedResponseSelectionSchema = z.enum(["mixed", "completing", "screened_out"]);
export const FixedBatchStatusSchema = z.enum(["running", "paused", "completed", "attention", "cancelled"]);
export const FixedJobStatusSchema = z.enum(["pending", "running", "succeeded", "screened_out", "failed", "uncertain", "cancelled", "expired"]);
export const FixedCreateBatchSchema = z.object({
  mode: FixedBatchModeSchema,
  selection: FixedResponseSelectionSchema.default("mixed"),
  count: z.number().int().min(1).max(10_000),
  timezone: z.string().min(1).max(100).refine((value) => {
    try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; } catch { return false; }
  }, "Use a valid IANA timezone"),
  startAt: z.iso.datetime({ offset: true }).optional(),
  endAt: z.iso.datetime({ offset: true }).optional(),
  requestId: z.uuid(),
}).strict().superRefine((value, context) => {
  if (value.mode === "scheduled") {
    if (value.selection !== "mixed") context.addIssue({ code: "custom", path: ["selection"], message: "Scheduled batches use the mixed dataset distribution" });
    if (!value.startAt) context.addIssue({ code: "custom", path: ["startAt"], message: "A scheduled batch needs a start time" });
    if (!value.endAt) context.addIssue({ code: "custom", path: ["endAt"], message: "A scheduled batch needs an end time" });
    if (value.startAt && value.endAt && Date.parse(value.endAt) <= Date.parse(value.startAt)) {
      context.addIssue({ code: "custom", path: ["endAt"], message: "End time must be after start time" });
    }
  } else if (value.startAt !== undefined || value.endAt !== undefined) {
    context.addIssue({ code: "custom", path: ["startAt"], message: "Immediate batches do not take a scheduled time window" });
  }
});

export type FixedCreateBatch = z.infer<typeof FixedCreateBatchSchema>;
export type FixedBatchMode = z.infer<typeof FixedBatchModeSchema>;
export type FixedResponseSelection = z.infer<typeof FixedResponseSelectionSchema>;
export type FixedBatchStatus = z.infer<typeof FixedBatchStatusSchema>;
export type FixedJobStatus = z.infer<typeof FixedJobStatusSchema>;
export interface FixedCounts {
  pending: number; running: number; succeeded: number; screened_out: number; failed: number;
  uncertain: number; cancelled: number; expired: number;
}
export interface FixedJob {
  id: string; rowId: string; scheduledAt: string; startedAt: string | null;
  finishedAt: string | null; status: FixedJobStatus; detail: string;
  terminalPageId: number | null; terminalPageTitle: string | null; closeReason: string | null;
}
export interface FixedBatch {
  id: string; mode: FixedBatchMode; selection: FixedResponseSelection; timezone: string; startAt: string; endAt: string;
  count: number; status: FixedBatchStatus; createdAt: string; counts: FixedCounts; jobs?: FixedJob[];
}
export interface FixedMeta {
  formTitle: string; formUrl: string; datasetName: string; datasetDigest: string;
  totalCount: number; completingCount: number; screenedOutCount: number; eligibleCount: number; availableCount: number;
  availableCompletingCount: number; availableScreenedOutCount: number; synthetic: true; enabled: boolean;
  disabledReason: string | null;
}

export interface FixedReconciliation {
  source: "google-sheet-csv";
  status: "never" | "ok" | "error";
  mirroredCount: number;
  sourceCount: number;
  columnCount: number;
  sourceDigest: string | null;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  error: string | null;
}
