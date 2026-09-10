import {
  Inject, Injectable, Logger, Optional, type BeforeApplicationShutdown, type OnApplicationBootstrap, type OnModuleInit,
} from "@nestjs/common";
import type { FixedCreateBatch, FixedMeta, FixedReconciliation } from "@form-copilot/contracts";
import { FIXED_FORM_TITLE, FIXED_FORM_URL, loadFixedDataset } from "./dataset.js";
import { isInvalidRow } from "./row-selection.js";
import { runFixedFormRow } from "./form-runner.js";
import { FixedRepository } from "./repository.js";
import { FixedScheduler } from "./scheduler.js";
import type { FixedDataset, FixedRunner } from "./types.js";
import {
  FIXED_RESPONSE_CSV_URL, FIXED_RESPONSE_SOURCE_KEY, loadFixedResponseSnapshot, type FixedResponseSnapshot,
} from "./response-sync.js";

export const FIXED_DATASET_LOADER = Symbol("FIXED_DATASET_LOADER");
export const FIXED_RUNNER = Symbol("FIXED_RUNNER");
export const FIXED_ENABLED = Symbol("FIXED_ENABLED");
export const FIXED_RESPONSE_LOADER = Symbol("FIXED_RESPONSE_LOADER");

@Injectable()
export class FixedService implements OnModuleInit, OnApplicationBootstrap, BeforeApplicationShutdown {
  readonly #logger = new Logger(FixedService.name);
  readonly #enabled: boolean;
  readonly #loader: () => Promise<FixedDataset>;
  readonly #scheduler: FixedScheduler;
  readonly #responseLoader: () => Promise<FixedResponseSnapshot>;
  #dataset!: FixedDataset;
  #timer: NodeJS.Timeout | undefined;
  #responseTimer: NodeJS.Timeout | undefined;
  #responseSync: Promise<void> | undefined;

  constructor(
    @Inject(FixedRepository) private readonly repository: FixedRepository,
    @Optional() @Inject(FIXED_DATASET_LOADER) loader?: () => Promise<FixedDataset>,
    @Optional() @Inject(FIXED_RUNNER) runner?: FixedRunner,
    @Optional() @Inject(FIXED_ENABLED) enabled?: boolean,
    @Optional() @Inject(FIXED_RESPONSE_LOADER) responseLoader?: () => Promise<FixedResponseSnapshot>,
  ) {
    this.#enabled = enabled ?? process.env.FORM_COPILOT_ENABLE_SUBMISSIONS === "true";
    this.#loader = loader ?? loadFixedDataset;
    this.#responseLoader = responseLoader ?? loadFixedResponseSnapshot;
    this.#scheduler = new FixedScheduler(repository, runner ?? runFixedFormRow, () => this.#enabled,
      () => this.#logger.error("Fixed dispatcher lost its database connection or failed to persist a result; recovery will preserve uncertainty"));
  }
  async onModuleInit(): Promise<void> {
    this.#dataset = await this.#loader();
    if (!this.#dataset.rows.length || new Set(this.#dataset.rows.map((row) => row.id)).size !== this.#dataset.rows.length) {
      throw new Error("Fixed dataset must contain source rows with unique Synthetic_ID values");
    }
  }
  onApplicationBootstrap(): void {
    this.#timer = setInterval(() => { void this.#scheduler.tick(); }, 1_000);
    this.#timer.unref();
    void this.#scheduler.tick();
    this.#responseTimer = setInterval(() => { void this.synchronizeResponses(); }, 60_000);
    this.#responseTimer.unref();
    void this.synchronizeResponses();
  }
  async beforeApplicationShutdown(): Promise<void> {
    if (this.#timer) clearInterval(this.#timer);
    if (this.#responseTimer) clearInterval(this.#responseTimer);
    await this.#responseSync?.catch(() => {});
    await this.#scheduler.stop();
  }
  async synchronizeResponses(): Promise<void> {
    if (this.#responseSync) return this.#responseSync;
    this.#responseSync = (async () => {
      try {
        const snapshot = await this.#responseLoader();
        await this.repository.replaceResponseMirror(snapshot);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown response synchronization error";
        await this.repository.recordResponseSyncFailure(
          FIXED_RESPONSE_SOURCE_KEY,
          process.env.FORM_COPILOT_RESPONSE_CSV_URL?.trim() || FIXED_RESPONSE_CSV_URL,
          message,
        ).catch(() => {});
        this.#logger.warn(`Response mirror synchronization failed: ${message}`);
      }
    })();
    try { await this.#responseSync; } finally { this.#responseSync = undefined; }
  }
  reconciliation(): Promise<FixedReconciliation> { return this.repository.getReconciliation(FIXED_RESPONSE_SOURCE_KEY); }
  async meta(): Promise<FixedMeta> {
    const completingRows = this.#dataset.rows.filter((row) => !isInvalidRow(row));
    const screenedRows = this.#dataset.rows.filter(isInvalidRow);
    return {
      formTitle: FIXED_FORM_TITLE, formUrl: FIXED_FORM_URL,
      datasetName: this.#dataset.name, datasetDigest: this.#dataset.digest,
      totalCount: this.#dataset.rows.length,
      completingCount: completingRows.length,
      screenedOutCount: screenedRows.length,
      eligibleCount: this.#dataset.rows.length,
      availableCount: await this.repository.availableCount(this.#dataset.rows.map((row) => row.id)),
      availableCompletingCount: await this.repository.availableCount(completingRows.map((row) => row.id)),
      availableScreenedOutCount: await this.repository.availableCount(screenedRows.map((row) => row.id)),
      synthetic: true, enabled: this.#enabled,
      disabledReason: this.#enabled ? null : "Máy chủ cho phép lưu kế hoạch nhưng chưa cho phép gửi dữ liệu ra Google Form.",
    };
  }
  createBatch(request: FixedCreateBatch) { return this.repository.createBatch(request, this.#dataset); }
  listBatches() { return this.repository.listBatches(); }
  getBatch(id: string) { return this.repository.getBatch(id); }
  transition(id: string, action: "pause" | "resume" | "cancel") { return this.repository.transition(id, action); }
  retryJob(id: string, requestId: string) { return this.repository.retryJob(id, requestId); }
}
