import type { FixedBatch, FixedCreateBatch, FixedJobStatus } from "@form-copilot/contracts";
import type { FixedDatasetRow } from "./dataset.js";

export interface FixedDataset {
  name: string; digest: string; rows: FixedDatasetRow[];
}
export interface PlannedBatch {
  startAt: string; endAt: string; scheduledAt: string[];
}
export type StoredJobStatus = FixedJobStatus | "submitting";
export type ConfirmedJobStatus = "succeeded" | "screened_out";
export type FinalJobStatus = ConfirmedJobStatus | "failed" | "uncertain";
export interface SubmissionIntent {
  expectedStatus: ConfirmedJobStatus;
  terminalPageId: number | null;
  terminalPageTitle: string | null;
  closeReason: string | null;
}
export interface ClaimedJob {
  id: string; batchId: string; workerId: string; row: FixedDatasetRow; scheduledAt: string;
}
export interface FixedRunnerResult extends Partial<SubmissionIntent> { status: FinalJobStatus; detail: string }
export type FixedRunner = (row: FixedDatasetRow, hooks: { beforeSubmit: (intent: SubmissionIntent) => Promise<void> }) => Promise<FixedRunnerResult>;
export interface FixedStore {
  availableCount(rowIds: string[]): Promise<number>;
  createBatch(request: FixedCreateBatch, dataset: FixedDataset): Promise<FixedBatch>;
  listBatches(): Promise<FixedBatch[]>;
  getBatch(id: string): Promise<FixedBatch>;
  transition(id: string, action: "pause" | "resume" | "cancel"): Promise<FixedBatch>;
  retryJob(id: string, requestId: string): Promise<FixedBatch>;
}
