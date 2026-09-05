import {
  Inject, Injectable, Logger, Optional, type BeforeApplicationShutdown, type OnApplicationBootstrap, type OnModuleInit,
} from "@nestjs/common";
import type { FixedCreateBatch, FixedMeta } from "@form-copilot/contracts";
import { FIXED_FORM_TITLE, FIXED_FORM_URL, loadFixedDataset } from "./dataset.js";
import { runFixedFormRow } from "./form-runner.js";
import { FixedRepository } from "./repository.js";
import { FixedScheduler } from "./scheduler.js";
import type { FixedDataset, FixedRunner } from "./types.js";

export const FIXED_DATASET_LOADER = Symbol("FIXED_DATASET_LOADER");
export const FIXED_RUNNER = Symbol("FIXED_RUNNER");
export const FIXED_ENABLED = Symbol("FIXED_ENABLED");

@Injectable()
export class FixedService implements OnModuleInit, OnApplicationBootstrap, BeforeApplicationShutdown {
  readonly #logger = new Logger(FixedService.name);
  readonly #enabled: boolean;
  readonly #loader: () => Promise<FixedDataset>;
  readonly #scheduler: FixedScheduler;
  #dataset!: FixedDataset;
  #timer: NodeJS.Timeout | undefined;

  constructor(
    @Inject(FixedRepository) private readonly repository: FixedRepository,
    @Optional() @Inject(FIXED_DATASET_LOADER) loader?: () => Promise<FixedDataset>,
    @Optional() @Inject(FIXED_RUNNER) runner?: FixedRunner,
    @Optional() @Inject(FIXED_ENABLED) enabled?: boolean,
  ) {
    this.#enabled = enabled ?? process.env.FORM_COPILOT_ENABLE_SUBMISSIONS === "true";
    this.#loader = loader ?? loadFixedDataset;
    this.#scheduler = new FixedScheduler(repository, runner ?? runFixedFormRow, () => this.#enabled,
      () => this.#logger.error("Fixed dispatcher lost its database connection or failed to persist a result; recovery will preserve uncertainty"));
  }
  async onModuleInit(): Promise<void> {
    this.#dataset = await this.#loader();
    if (!this.#dataset.rows.length || new Set(this.#dataset.rows.map((row) => row.id)).size !== this.#dataset.rows.length) {
      throw new Error("Fixed dataset must contain eligible rows with unique Synthetic_ID values");
    }
  }
  onApplicationBootstrap(): void {
    this.#timer = setInterval(() => { void this.#scheduler.tick(); }, 1_000);
    this.#timer.unref();
    void this.#scheduler.tick();
  }
  async beforeApplicationShutdown(): Promise<void> {
    if (this.#timer) clearInterval(this.#timer);
    await this.#scheduler.stop();
  }
  async meta(): Promise<FixedMeta> {
    return {
      formTitle: FIXED_FORM_TITLE, formUrl: FIXED_FORM_URL,
      datasetName: this.#dataset.name, datasetDigest: this.#dataset.digest,
      eligibleCount: this.#dataset.rows.length,
      availableCount: await this.repository.availableCount(this.#dataset.rows.map((row) => row.id)),
      synthetic: true, enabled: this.#enabled,
      disabledReason: this.#enabled ? null : "Máy chủ cho phép lưu kế hoạch nhưng chưa cho phép gửi dữ liệu ra Google Form.",
    };
  }
  createBatch(request: FixedCreateBatch) { return this.repository.createBatch(request, this.#dataset); }
  listBatches() { return this.repository.listBatches(); }
  getBatch(id: string) { return this.repository.getBatch(id); }
  transition(id: string, action: "pause" | "resume" | "cancel") { return this.repository.transition(id, action); }
}
