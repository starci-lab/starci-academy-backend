import type { ClaimedJob, FixedRunner, SubmissionIntent } from "./types.js";
import { DispatcherLease, FixedRepository } from "./repository.js";

export type DispatcherStore = Pick<FixedRepository, "tryAcquireDispatcher" | "recover" | "maintain" | "claim" | "beforeSubmit" | "finish">;

/** No overlapping ticks. Exactly one PG-session lock is held throughout an active browser run. */
export class FixedScheduler {
  #lease: DispatcherLease | null = null;
  #running: Promise<void> | null = null;
  #stopping = false;
  constructor(
    private readonly store: DispatcherStore,
    private readonly runner: FixedRunner,
    private readonly enabled: () => boolean,
    private readonly reportError: () => void = () => {},
  ) {}

  tick(): Promise<void> {
    if (this.#stopping) return Promise.resolve();
    if (this.#running) return this.#running;
    this.#running = this.#tick().catch(async () => {
      this.reportError();
      // Leaving an unresolved running/submitting record is deliberate: the next leader recovers it as uncertain.
      if (this.#lease) await this.#lease.close().catch(() => {});
      this.#lease = null;
    }).finally(() => { this.#running = null; });
    return this.#running;
  }

  async #tick(): Promise<void> {
    if (this.#lease && !this.#lease.alive) {
      await this.#lease.close();
      this.#lease = null;
    }
    if (!this.#lease) {
      this.#lease = await this.store.tryAcquireDispatcher();
      if (!this.#lease) return;
      await this.store.recover(this.#lease);
    }
    if (!this.enabled()) {
      await this.store.maintain(this.#lease);
      return;
    }
    const job = await this.store.claim(this.#lease);
    if (job) await this.#run(job, this.#lease);
  }

  async #run(job: ClaimedJob, lease: DispatcherLease): Promise<void> {
    let crossedBoundary = false;
    const submittedIntent: { value: SubmissionIntent | null } = { value: null };
    let result: Awaited<ReturnType<FixedRunner>>;
    try {
      result = await this.runner(job.row, { beforeSubmit: async (intent) => {
        if (!this.enabled() || this.#stopping) throw new Error("Submissions are disabled; final submit prohibited");
        if (crossedBoundary) throw new Error("The final-submit hook may only be invoked once");
        await this.store.beforeSubmit(lease, job, intent);
        crossedBoundary = true;
        submittedIntent.value = intent;
      } });
      if (["succeeded", "screened_out"].includes(result.status) && !crossedBoundary) {
        result = { ...result, status: "failed", detail: "Driver returned a confirmed outcome without the required durable submission boundary" };
      } else if (["succeeded", "screened_out"].includes(result.status) && submittedIntent.value?.expectedStatus !== result.status) {
        result = { ...result, status: "uncertain", detail: "Confirmed driver outcome did not match the durable submission intent. Do not retry automatically." };
      } else if (result.status === "failed" && crossedBoundary) {
        result = { ...result, status: "uncertain", detail: "Final submit was attempted without a confirmed response. Do not retry automatically." };
      }
    } catch {
      result = crossedBoundary
        ? { ...(submittedIntent.value ?? { expectedStatus: "succeeded", terminalPageId: null, terminalPageTitle: null, closeReason: null }), status: "uncertain", detail: "Worker interrupted after the final-submit boundary. Verify the remote result; no automatic retry." }
        : { expectedStatus: "succeeded", terminalPageId: null, terminalPageTitle: null, closeReason: null, status: "failed", detail: "Worker stopped before final submit. Check the fixed form schema, browser availability, and batch controls." };
    }
    await this.store.finish(job, result.status, result.detail);
  }

  async stop(): Promise<void> {
    this.#stopping = true;
    await this.#running;
    if (this.#lease) await this.#lease.close();
    this.#lease = null;
  }
}
