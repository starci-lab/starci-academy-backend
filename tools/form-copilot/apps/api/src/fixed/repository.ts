import {
  BadRequestException, ConflictException, Inject, Injectable, NotFoundException, Optional,
  type OnApplicationShutdown, type OnModuleInit,
} from "@nestjs/common";
import type { FixedBatch, FixedBatchStatus, FixedCounts, FixedCreateBatch, FixedJob } from "@form-copilot/contracts";
import { randomUUID } from "node:crypto";
import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { appConfig } from "../config.js";
import { planBatch, requestFingerprint } from "./planner.js";
import { FIXED_SCHEMA_SQL } from "./schema.js";
import type { ClaimedJob, FinalJobStatus, FixedDataset, FixedStore, SubmissionIntent } from "./types.js";

export const FIXED_POOL = Symbol("FIXED_POOL");
const LOCK_NAMESPACE = 1647345;
const DISPATCHER_LOCK = 1;
const CREATE_LOCK = 2;
const MIGRATION_LOCK = 3;
const RESERVED = "('pending', 'running', 'submitting', 'succeeded', 'screened_out', 'uncertain')";
const BATCH_SELECT = `SELECT b.id, b.mode, b.timezone, b.start_at, b.end_at, b.requested_count,
  b.status, b.created_at,
  count(j.id) FILTER (WHERE j.status = 'pending')::int AS pending,
  count(j.id) FILTER (WHERE j.status IN ('running', 'submitting'))::int AS running,
  count(j.id) FILTER (WHERE j.status = 'succeeded')::int AS succeeded,
  count(j.id) FILTER (WHERE j.status = 'screened_out')::int AS screened_out,
  count(j.id) FILTER (WHERE j.status = 'failed')::int AS failed,
  count(j.id) FILTER (WHERE j.status = 'uncertain')::int AS uncertain,
  count(j.id) FILTER (WHERE j.status = 'cancelled')::int AS cancelled,
  count(j.id) FILTER (WHERE j.status = 'expired')::int AS expired
  FROM fixed_batches b LEFT JOIN fixed_jobs j ON j.batch_id = b.id`;

type Sql = Pick<PoolClient, "query">;
function iso(value: Date | string): string { return new Date(value).toISOString(); }
function batchJson(row: QueryResultRow): FixedBatch {
  const counts: FixedCounts = {
    pending: Number(row.pending), running: Number(row.running), succeeded: Number(row.succeeded),
    screened_out: Number(row.screened_out), failed: Number(row.failed), uncertain: Number(row.uncertain), cancelled: Number(row.cancelled), expired: Number(row.expired),
  };
  return {
    id: row.id, mode: row.mode, timezone: row.timezone, startAt: iso(row.start_at), endAt: iso(row.end_at),
    count: row.requested_count, status: row.status, createdAt: iso(row.created_at), counts,
  };
}

/** One session-level PG lock owns dispatch. Standby API replicas never recover the live leader's work. */
export class DispatcherLease {
  readonly workerId = randomUUID();
  alive = true;
  readonly #onError = () => { this.alive = false; };
  constructor(readonly client: PoolClient) { client.on("error", this.#onError); }
  async verify(): Promise<void> {
    if (!this.alive) throw new Error("Dispatcher leadership was lost");
    await this.client.query("SELECT 1");
    if (!this.alive) throw new Error("Dispatcher leadership was lost");
  }
  async close(): Promise<void> {
    if (this.alive) {
      try { await this.client.query("SELECT pg_advisory_unlock($1, $2)", [LOCK_NAMESPACE, DISPATCHER_LOCK]); }
      catch { this.alive = false; }
    }
    this.client.off("error", this.#onError);
    this.client.release(!this.alive);
    this.alive = false;
  }
}

export class SubmissionStopped extends Error {
  constructor(message: string) { super(message); this.name = "SubmissionStopped"; }
}

@Injectable()
export class FixedRepository implements FixedStore, OnModuleInit, OnApplicationShutdown {
  readonly #pool: Pool;
  constructor(@Optional() @Inject(FIXED_POOL) pool?: Pool) {
    this.#pool = pool ?? new Pool({
      connectionString: appConfig.databaseUrl, max: 6,
      connectionTimeoutMillis: 10_000, idleTimeoutMillis: 30_000,
      application_name: "form-copilot-fixed",
    });
    // A failed idle connection must not crash the process or leak a credential-bearing DSN.
    this.#pool.on("error", () => {});
  }

  async onModuleInit(): Promise<void> {
    await this.#transaction(async (client) => {
      await client.query("SELECT pg_advisory_xact_lock($1, $2)", [LOCK_NAMESPACE, MIGRATION_LOCK]);
      await client.query(FIXED_SCHEMA_SQL);
    });
  }
  async health(): Promise<boolean> {
    try { await this.#pool.query("SELECT 1"); return true; } catch { return false; }
  }
  async onApplicationShutdown(): Promise<void> { await this.#pool.end(); }

  async #transaction<T>(body: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.#pool.connect();
    try {
      await client.query("BEGIN");
      const result = await body(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally { client.release(); }
  }

  async availableCount(rowIds: string[]): Promise<number> {
    const result = await this.#pool.query<{ count: number }>(`
      SELECT count(DISTINCT candidate)::int AS count FROM unnest($1::text[]) AS candidate
      WHERE NOT EXISTS (SELECT 1 FROM fixed_jobs j WHERE j.row_id = candidate AND j.status IN ${RESERVED})`, [rowIds]);
    return result.rows[0]!.count;
  }

  async createBatch(request: FixedCreateBatch, dataset: FixedDataset): Promise<FixedBatch> {
    const fingerprint = requestFingerprint(request);
    const id = await this.#transaction(async (client) => {
      // Serializes reservation selection across all API replicas; the partial unique index is a second guard.
      await client.query("SELECT pg_advisory_xact_lock($1, $2)", [LOCK_NAMESPACE, CREATE_LOCK]);
      const existing = await client.query<{ id: string; request_fingerprint: string }>(
        "SELECT id, request_fingerprint FROM fixed_batches WHERE request_id = $1", [request.requestId],
      );
      if (existing.rows[0]) {
        if (existing.rows[0].request_fingerprint !== fingerprint) throw new ConflictException("requestId was already used with different batch settings");
        return existing.rows[0].id;
      }
      const plan = planBatch(request);
      const reserved = await client.query<{ row_id: string }>(`SELECT row_id FROM fixed_jobs WHERE status IN ${RESERVED}`);
      const used = new Set(reserved.rows.map((row) => row.row_id));
      const rows = dataset.rows.filter((row) => !used.has(row.id)).slice(0, request.count);
      if (rows.length !== request.count) throw new ConflictException({
        statusCode: 409, error: "Conflict", code: "INSUFFICIENT_ROWS",
        message: `Only ${rows.length} unused eligible rows are available; lower the exact count`,
      });
      const batchId = randomUUID();
      await client.query(`INSERT INTO fixed_batches
        (id, request_id, request_fingerprint, mode, timezone, start_at, end_at, requested_count, status, dataset_name, dataset_digest)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'running', $9, $10)`, [
        batchId, request.requestId, fingerprint, request.mode, request.timezone, plan.startAt, plan.endAt,
        request.count, dataset.name, dataset.digest,
      ]);
      // Persist the exact dataset snapshot: a subsequent deployment cannot mutate an existing job's answers.
      await client.query(`INSERT INTO fixed_jobs (id, batch_id, row_id, row_json, scheduled_at, status)
        SELECT (value->>'id')::uuid, $1, value->>'rowId', value->'row', (value->>'scheduledAt')::timestamptz, 'pending'
        FROM jsonb_array_elements($2::jsonb) AS value`, [batchId, JSON.stringify(rows.map((row, index) => ({
        id: randomUUID(), rowId: row.id, row, scheduledAt: plan.scheduledAt[index],
      })))]);
      return batchId;
    });
    return this.getBatch(id);
  }

  async listBatches(): Promise<FixedBatch[]> {
    const result = await this.#pool.query(`${BATCH_SELECT} GROUP BY b.id ORDER BY b.created_at DESC LIMIT 100`);
    return result.rows.map(batchJson);
  }
  async getBatch(id: string): Promise<FixedBatch> {
    const result = await this.#pool.query(`${BATCH_SELECT} WHERE b.id = $1 GROUP BY b.id`, [id]);
    if (!result.rows[0]) throw new NotFoundException("Batch not found");
    const jobs = await this.#pool.query(`SELECT id, row_id, scheduled_at, started_at, finished_at, status, detail, terminal_page_id, terminal_page_title, close_reason
      FROM fixed_jobs WHERE batch_id = $1 ORDER BY scheduled_at, id`, [id]);
    return { ...batchJson(result.rows[0]), jobs: jobs.rows.map((row): FixedJob => ({
      id: row.id, rowId: row.row_id, scheduledAt: iso(row.scheduled_at),
      startedAt: row.started_at ? iso(row.started_at) : null, finishedAt: row.finished_at ? iso(row.finished_at) : null,
      status: row.status === "submitting" ? "running" : row.status, detail: row.detail,
      terminalPageId: row.terminal_page_id === null ? null : Number(row.terminal_page_id), terminalPageTitle: row.terminal_page_title, closeReason: row.close_reason,
    })) };
  }

  async transition(id: string, action: "pause" | "resume" | "cancel"): Promise<FixedBatch> {
    await this.#transaction(async (client) => {
      await this.#expire(client);
      const result = await client.query<{ status: FixedBatchStatus; end_at: Date }>(
        "SELECT status, end_at FROM fixed_batches WHERE id = $1 FOR UPDATE", [id],
      );
      const batch = result.rows[0];
      if (!batch) throw new NotFoundException("Batch not found");
      if (action === "cancel" && batch.status === "cancelled") return;
      if (action === "pause" && batch.status === "paused") return;
      if (action === "resume" && batch.status === "running") return;
      if (["completed", "attention", "cancelled"].includes(batch.status)) throw new ConflictException("This batch is terminal; it cannot be resumed or changed");
      if (action === "resume" && new Date(batch.end_at).getTime() <= Date.now()) throw new BadRequestException("The batch time window has expired");
      const target = action === "cancel" ? "cancelled" : action === "pause" ? "paused" : "running";
      await client.query("UPDATE fixed_batches SET status = $2 WHERE id = $1", [id, target]);
      if (action === "cancel") await client.query(`UPDATE fixed_jobs SET status = 'cancelled', finished_at = now(),
        detail = 'Cancelled before execution' WHERE batch_id = $1 AND status = 'pending'`, [id]);
    });
    return this.getBatch(id);
  }

  async #refresh(client: Sql, batchId: string): Promise<void> {
    await client.query(`UPDATE fixed_batches b SET status = CASE
      WHEN EXISTS (SELECT 1 FROM fixed_jobs j WHERE j.batch_id = b.id AND j.status IN ('failed', 'uncertain', 'expired')) THEN 'attention'
      ELSE 'completed' END
      WHERE b.id = $1 AND b.status IN ('running', 'paused')
      AND NOT EXISTS (SELECT 1 FROM fixed_jobs j WHERE j.batch_id = b.id AND j.status IN ('pending', 'running', 'submitting'))`, [batchId]);
  }
  async #expire(client: Sql): Promise<void> {
    // All mutators take the parent batch lock before its job locks, preventing control/claim deadlocks.
    const expired = await client.query<{ id: string }>(`SELECT id FROM fixed_batches
      WHERE end_at <= now() AND status IN ('running', 'paused') ORDER BY id FOR UPDATE SKIP LOCKED`);
    for (const batch of expired.rows) {
      await client.query(`UPDATE fixed_jobs SET status = 'expired', finished_at = now(), detail = 'The allowed time window ended before execution'
        WHERE batch_id = $1 AND status = 'pending'`, [batch.id]);
      await this.#refresh(client, batch.id);
    }
  }

  async tryAcquireDispatcher(): Promise<DispatcherLease | null> {
    const client = await this.#pool.connect();
    try {
      const result = await client.query<{ acquired: boolean }>("SELECT pg_try_advisory_lock($1, $2) AS acquired", [LOCK_NAMESPACE, DISPATCHER_LOCK]);
      if (!result.rows[0]?.acquired) { client.release(); return null; }
      return new DispatcherLease(client);
    } catch (error) { client.release(true); throw error; }
  }

  async recover(lease: DispatcherLease): Promise<void> {
    await lease.verify();
    await lease.client.query("BEGIN");
    try {
      // Only the new exclusive leader does recovery. Never use a wall-clock lease to judge a live browser.
      const affected = await lease.client.query<{ id: string }>(`SELECT b.id FROM fixed_batches b
        WHERE EXISTS (SELECT 1 FROM fixed_jobs j WHERE j.batch_id = b.id AND j.status IN ('running', 'submitting'))
        ORDER BY b.id FOR UPDATE`);
      for (const batch of affected.rows) {
        await lease.client.query(`UPDATE fixed_jobs SET status = 'uncertain', finished_at = now(),
          detail = 'Previous worker stopped without a durable result. Not retried; verify the remote response manually.'
          WHERE batch_id = $1 AND status IN ('running', 'submitting')`, [batch.id]);
        await this.#refresh(lease.client, batch.id);
      }
      await this.#expire(lease.client);
      await lease.client.query("COMMIT");
    } catch (error) { await lease.client.query("ROLLBACK").catch(() => {}); throw error; }
  }

  async maintain(lease: DispatcherLease): Promise<void> {
    await lease.verify();
    await this.#transaction((client) => this.#expire(client));
  }

  async claim(lease: DispatcherLease): Promise<ClaimedJob | null> {
    await lease.verify();
    const client = lease.client;
    await client.query("BEGIN");
    try {
      await this.#expire(client);
      const batches = await client.query<{ id: string }>(`SELECT b.id FROM fixed_batches b
        WHERE b.status = 'running' AND b.start_at <= now() AND b.end_at > now()
        AND NOT EXISTS (SELECT 1 FROM fixed_jobs active WHERE active.status IN ('running', 'submitting'))
        AND EXISTS (SELECT 1 FROM fixed_jobs j WHERE j.batch_id = b.id AND j.status = 'pending' AND j.scheduled_at <= now())
        ORDER BY b.start_at, b.created_at FOR UPDATE OF b SKIP LOCKED LIMIT 1`);
      let claimed: ClaimedJob | null = null;
      if (batches.rows[0]) {
        const result = await client.query(`UPDATE fixed_jobs SET status = 'running', started_at = now(), worker_id = $2,
          detail = 'Worker is filling the fixed form; not yet submitted'
          WHERE id = (SELECT id FROM fixed_jobs WHERE batch_id = $1 AND status = 'pending' AND scheduled_at <= now()
            ORDER BY scheduled_at, id FOR UPDATE SKIP LOCKED LIMIT 1)
          RETURNING id, batch_id, row_json, scheduled_at`, [batches.rows[0].id, lease.workerId]);
        const job = result.rows[0];
        if (job) claimed = { id: job.id, batchId: job.batch_id, workerId: lease.workerId, row: job.row_json, scheduledAt: iso(job.scheduled_at) };
      }
      await client.query("COMMIT");
      return claimed;
    } catch (error) { await client.query("ROLLBACK").catch(() => {}); throw error; }
  }

  async beforeSubmit(lease: DispatcherLease, job: ClaimedJob, intent: SubmissionIntent = { expectedStatus: "succeeded", terminalPageId: null, terminalPageTitle: null, closeReason: null }): Promise<void> {
    await lease.verify();
    let stop: string | undefined;
    const client = lease.client;
    await client.query("BEGIN");
    try {
      const result = await client.query<{ status: FixedBatchStatus; within_window: boolean }>(
        "SELECT status, end_at > now() AS within_window FROM fixed_batches WHERE id = $1 FOR UPDATE", [job.batchId],
      );
      const batch = result.rows[0];
      if (!batch || batch.status !== "running" || !batch.within_window) {
        const status = !batch?.within_window ? "expired" : batch.status === "paused" ? "pending" : "cancelled";
        stop = status === "pending" ? "Paused before final submit; row remains pending" : `${status} before final submit`;
        await client.query(`UPDATE fixed_jobs SET status = $3, detail = $4,
          finished_at = CASE WHEN $3 = 'pending' THEN NULL ELSE now() END, worker_id = NULL
          WHERE id = $1 AND worker_id = $2 AND status = 'running'`, [job.id, job.workerId, status, stop]);
        await this.#refresh(client, job.batchId);
      } else {
        const updated = await client.query(`UPDATE fixed_jobs SET status = 'submitting',
          detail = 'Final submit boundary recorded; any unconfirmed outcome will require manual verification',
          terminal_page_id = $3, terminal_page_title = $4, close_reason = $5
          WHERE id = $1 AND worker_id = $2 AND status = 'running' RETURNING id`, [job.id, job.workerId, intent.terminalPageId, intent.terminalPageTitle, intent.closeReason]);
        if (updated.rowCount !== 1) stop = "Job no longer belongs to this worker; final submit prohibited";
      }
      await client.query("COMMIT");
    } catch (error) { await client.query("ROLLBACK").catch(() => {}); throw error; }
    if (stop) throw new SubmissionStopped(stop);
  }

  async finish(job: ClaimedJob, status: FinalJobStatus, detail: string): Promise<void> {
    await this.#transaction(async (client) => {
      // The batch lock orders this operation with pause/cancel and the next claim.
      await client.query("SELECT id FROM fixed_batches WHERE id = $1 FOR UPDATE", [job.batchId]);
      await client.query(`UPDATE fixed_jobs SET status = $3, finished_at = now(), detail = $4
        WHERE id = $1 AND worker_id = $2 AND status IN ('running', 'submitting')`, [job.id, job.workerId, status, detail.slice(0, 2_000)]);
      await this.#refresh(client, job.batchId);
    });
  }
}
