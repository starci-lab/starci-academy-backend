import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { ConflictException } from "@nestjs/common";
import type { FixedCreateBatch } from "@form-copilot/contracts";
import { FixedRepository, type DispatcherLease } from "./repository.js";
import type { FixedDataset } from "./types.js";
import type { FixedResponseSnapshot } from "./response-sync.js";

// Explicit opt-in only. A unique test-owned database is created and removed; no existing tables are truncated.
const databaseUrl = process.env.FORM_COPILOT_TEST_DATABASE_URL;
describe.skipIf(!databaseUrl).sequential("fixed repository / real PostgreSQL", () => {
  const databaseName = `fixed_test_${randomUUID().replaceAll("-", "")}`;
  let admin: Pool;
  let sql: Pool;
  let repository: FixedRepository;
  let replica: FixedRepository;
  let lease: DispatcherLease | null = null;

  function dataset(name: string, count = 3): FixedDataset {
    return { name: `Synthetic test fixture ${name}`, digest: `fixture-${name}`, rows: Array.from({ length: count }, (_, index) => ({
      id: `${name}-${index}`, answers: { fixture: "SYNTHETIC TEST ONLY", ordinal: String(index) },
    })) };
  }
  function request(count = 1): FixedCreateBatch {
    return { requestId: randomUUID(), count, mode: "immediate", selection: "mixed", timezone: "Asia/Bangkok" };
  }
  async function acquire() {
    lease = await repository.tryAcquireDispatcher();
    expect(lease).not.toBeNull();
    await repository.recover(lease!);
    return lease!;
  }
  async function release() { await lease?.close(); lease = null; }

  beforeAll(async () => {
    admin = new Pool({ connectionString: databaseUrl, max: 1 });
    if (!/^fixed_test_[a-f0-9]{32}$/.test(databaseName)) throw new Error("Invalid isolated test database name");
    await admin.query(`CREATE DATABASE "${databaseName}"`);
    const target = new URL(databaseUrl!); target.pathname = `/${databaseName}`;
    sql = new Pool({ connectionString: target.toString(), max: 2 });
    repository = new FixedRepository(new Pool({ connectionString: target.toString(), max: 6 }));
    replica = new FixedRepository(new Pool({ connectionString: target.toString(), max: 6 }));
    await Promise.all([repository.onModuleInit(), replica.onModuleInit()]);
  }, 30_000);
  afterAll(async () => {
    await release();
    await Promise.all([repository?.onApplicationShutdown(), replica?.onApplicationShutdown(), sql?.end()]);
    if (admin) {
      await admin.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
      await admin.end();
    }
  }, 30_000);

  it("creates exact-count snapshots atomically and replays concurrent requestId calls", async () => {
    const input = request(3); const data = dataset("idempotent");
    const [a, b] = await Promise.all([repository.createBatch(input, data), replica.createBatch(input, data)]);
    expect(a.id).toBe(b.id); expect(a.jobs).toHaveLength(3); expect(a.counts.pending).toBe(3);
    expect(await repository.availableCount(data.rows.map((row) => row.id))).toBe(0);
    expect((await sql.query("SELECT row_json FROM fixed_jobs WHERE batch_id = $1", [a.id])).rows[0]!.row_json.answers.fixture).toBe("SYNTHETIC TEST ONLY");
    await expect(repository.createBatch({ ...input, count: 2 }, data)).rejects.toThrow("different batch settings");
    await repository.transition(a.id, "cancel");
  });

  it("atomically replaces the response mirror without rewriting job history", async () => {
    const batch = await repository.createBatch(request(), dataset("mirror-history", 1));
    const before = await sql.query("SELECT row_json, status FROM fixed_jobs WHERE batch_id = $1", [batch.id]);
    const snapshot: FixedResponseSnapshot = {
      sourceKey: "test-source", sourceUrl: "https://example.test/responses.csv", headers: ["Timestamp", "Answer"], digest: "source-digest-2",
      rows: [
        { rowNumber: 1, submittedAtText: "first", values: ["first", "yes"], digest: "row-1" },
        { rowNumber: 2, submittedAtText: "second", values: ["second", "no"], digest: "row-2" },
      ],
    };
    await repository.replaceResponseMirror(snapshot);
    expect(await repository.getReconciliation("test-source")).toMatchObject({ status: "ok", mirroredCount: 2, sourceCount: 2, columnCount: 2, sourceDigest: "source-digest-2" });
    const firstSync = await sql.query("SELECT synced_at FROM fixed_remote_responses WHERE source_key = 'test-source' ORDER BY row_number");
    await repository.replaceResponseMirror(snapshot);
    const unchangedSync = await sql.query("SELECT synced_at FROM fixed_remote_responses WHERE source_key = 'test-source' ORDER BY row_number");
    expect(unchangedSync.rows).toEqual(firstSync.rows);
    await repository.replaceResponseMirror({ ...snapshot, digest: "source-digest-1", rows: snapshot.rows.slice(0, 1) });
    expect(await repository.getReconciliation("test-source")).toMatchObject({ status: "ok", mirroredCount: 1, sourceCount: 1, sourceDigest: "source-digest-1" });
    const after = await sql.query("SELECT row_json, status FROM fixed_jobs WHERE batch_id = $1", [batch.id]);
    expect(after.rows).toEqual(before.rows);
    await repository.recordResponseSyncFailure("test-source", snapshot.sourceUrl, "malformed fixture");
    expect(await repository.getReconciliation("test-source")).toMatchObject({ status: "error", mirroredCount: 1, sourceCount: 1, sourceDigest: "source-digest-1", error: "malformed fixture" });
    await repository.transition(batch.id, "cancel");
  });

  it("concurrent distinct batches cannot reserve the same row", async () => {
    const data = dataset("race", 2);
    const results = await Promise.allSettled([repository.createBatch(request(2), data), replica.createBatch(request(2), data)]);
    expect(results.filter((item) => item.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((item) => item.status === "rejected")).toHaveLength(1);
    for (const item of results) if (item.status === "fulfilled") await repository.transition(item.value.id, "cancel");
  });

  it("insufficient rows returns a typed precommit rejection without creating a batch", async () => {
    const input = request(2);
    const failure = await repository.createBatch(input, dataset("insufficient", 1)).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(ConflictException);
    expect((failure as ConflictException).getStatus()).toBe(409);
    expect((failure as ConflictException).getResponse()).toMatchObject({ code: "INSUFFICIENT_ROWS", statusCode: 409 });
    const persisted = await sql.query("SELECT count(*)::int AS count FROM fixed_batches WHERE request_id = $1", [input.requestId]);
    expect(persisted.rows[0]!.count).toBe(0);
    expect(await repository.availableCount(["insufficient-0"])).toBe(1);
  });

  it("the database unique index independently rejects duplicate active reservations", async () => {
    const batch = await repository.createBatch(request(), dataset("index", 1));
    const other = await repository.createBatch(request(), dataset("index-other", 1));
    await expect(sql.query(`INSERT INTO fixed_jobs(id, batch_id, row_id, row_json, scheduled_at, status)
      SELECT $1, $2, row_id, row_json, scheduled_at, 'pending' FROM fixed_jobs WHERE batch_id = $3`, [randomUUID(), other.id, batch.id]))
      .rejects.toMatchObject({ code: "23505" });
    await repository.transition(batch.id, "cancel"); await repository.transition(other.id, "cancel");
  });

  it("only one replica owns dispatch, and standby does not alter live running work", async () => {
    const batch = await repository.createBatch(request(), dataset("leader", 1));
    const queued = await repository.createBatch(request(), dataset("leader-queued", 1));
    const leader = await acquire();
    const job = await repository.claim(leader);
    expect(job?.batchId).toBe(batch.id);
    expect(await repository.claim(leader)).toBeNull();
    expect(await replica.tryAcquireDispatcher()).toBeNull();
    expect((await repository.getBatch(batch.id)).counts.running).toBe(1);
    await repository.beforeSubmit(leader, job!);
    const persisted = await sql.query("SELECT status FROM fixed_jobs WHERE id = $1", [job!.id]);
    expect(persisted.rows[0]!.status).toBe("submitting");
    await repository.finish(job!, "succeeded", "Local fixture confirmation");
    expect((await repository.getBatch(batch.id)).status).toBe("completed");
    expect(await repository.availableCount([job!.row.id])).toBe(0);
    await expect(repository.createBatch(request(), dataset("leader", 1))).rejects.toThrow("unused rows");
    await repository.transition(queued.id, "cancel");
    await release();
  });

  it("restart recovers both running and submitting jobs as uncertain, never re-sends them", async () => {
    for (const phase of ["running", "submitting"]) {
      const batch = await repository.createBatch(request(), dataset(`restart-${phase}`, 1));
      const first = await acquire(); const job = await repository.claim(first);
      expect(job?.batchId).toBe(batch.id);
      if (phase === "submitting") await repository.beforeSubmit(first, job!);
      await release();
      const successor = await acquire();
      expect((await repository.getBatch(batch.id)).counts.uncertain).toBe(1);
      expect((await repository.getBatch(batch.id)).status).toBe("attention");
      expect(await repository.claim(successor)).toBeNull();
      expect(await repository.availableCount([job!.row.id])).toBe(0);
      // A late old-worker result cannot overwrite conservative recovery.
      await repository.finish(job!, "succeeded", "Late result from invalid leader");
      expect((await repository.getBatch(batch.id)).counts.uncertain).toBe(1);
      await release();
    }
  });

  it("persists a confirmed screen-out with terminal evidence and keeps the row reserved", async () => {
    const batch = await repository.createBatch(request(), dataset("screened", 1));
    const leader = await acquire();
    const job = await repository.claim(leader);
    const intent = { expectedStatus: "screened_out" as const, terminalPageId: 1486587414, terminalPageTitle: "Cảm ơn bạn đã quan tâm. / Thank you for your interest.", closeReason: "S4=0" };
    await repository.beforeSubmit(leader, job!, intent);
    await repository.finish(job!, "screened_out", "Local fixture early-close confirmation");
    const result = await repository.getBatch(batch.id);
    expect(result.status).toBe("completed");
    expect(result.counts.screened_out).toBe(1);
    expect(result.jobs?.[0]).toMatchObject({ status: "screened_out", terminalPageId: 1486587414, terminalPageTitle: intent.terminalPageTitle, closeReason: "S4=0" });
    expect(await repository.availableCount([job!.row.id])).toBe(0);
    await expect(repository.createBatch(request(), dataset("screened", 1))).rejects.toThrow("unused rows");
    await release();
  });

  it("expired windows become terminal during recovery with no catch-up burst", async () => {
    const batch = await repository.createBatch(request(3), dataset("expired", 3));
    await sql.query("UPDATE fixed_batches SET start_at = now() - interval '2 hours', end_at = now() - interval '1 hour' WHERE id = $1", [batch.id]);
    const leader = await acquire();
    expect(await repository.claim(leader)).toBeNull();
    const result = await repository.getBatch(batch.id);
    expect(result.counts.expired).toBe(3); expect(result.status).toBe("attention");
    await expect(repository.transition(batch.id, "resume")).rejects.toThrow("terminal");
    expect(await repository.availableCount(dataset("expired", 3).rows.map((row) => row.id))).toBe(3);
    await release();
  });

  it("retries failed or expired work as a new linked, idempotent immediate attempt", async () => {
    const failedBatch = await repository.createBatch(request(), dataset("retry-failed", 1));
    const leader = await acquire();
    const failedJob = await repository.claim(leader);
    await repository.finish(failedJob!, "failed", "Synthetic pre-submit fixture failure");
    await release();

    const retryRequestId = randomUUID();
    const [firstRetry, replayedRetry] = await Promise.all([
      repository.retryJob(failedJob!.id, retryRequestId),
      replica.retryJob(failedJob!.id, retryRequestId),
    ]);
    expect(replayedRetry.id).toBe(firstRetry.id);
    expect(firstRetry).toMatchObject({ mode: "immediate", count: 1, counts: { pending: 1 } });
    expect(firstRetry.jobs?.[0]).toMatchObject({
      rowId: failedJob!.row.id,
      status: "pending",
      retryOfJobId: failedJob!.id,
    });
    expect((await repository.getBatch(failedBatch.id)).jobs?.[0]).toMatchObject({
      status: "failed",
      retryOfJobId: null,
    });
    await expect(repository.retryJob(failedJob!.id, randomUUID())).rejects.toThrow("already reserved");
    await repository.transition(firstRetry.id, "cancel");

    const expiredBatch = await repository.createBatch(request(), dataset("retry-expired", 1));
    await sql.query("UPDATE fixed_batches SET start_at = now() - interval '2 hours', end_at = now() - interval '1 hour' WHERE id = $1", [expiredBatch.id]);
    const expiryLeader = await acquire();
    expect(await repository.claim(expiryLeader)).toBeNull();
    await release();
    const expired = await repository.getBatch(expiredBatch.id);
    const expiredRetry = await repository.retryJob(expired.jobs![0]!.id, randomUUID());
    expect(expiredRetry.jobs?.[0]).toMatchObject({ rowId: "retry-expired-0", retryOfJobId: expired.jobs![0]!.id, status: "pending" });
    await repository.transition(expiredRetry.id, "cancel");
  });

  it("never retries uncertain work because a remote submission may already exist", async () => {
    const batch = await repository.createBatch(request(), dataset("retry-uncertain", 1));
    const leader = await acquire(); const job = await repository.claim(leader);
    await repository.beforeSubmit(leader, job!);
    await repository.finish(job!, "uncertain", "Synthetic confirmation loss");
    await release();
    await expect(repository.retryJob(job!.id, randomUUID())).rejects.toThrow("source reconciliation");
    expect(await repository.availableCount([job!.row.id])).toBe(0);
    expect((await repository.getBatch(batch.id)).counts.uncertain).toBe(1);
  });

  it("future jobs remain pending and preserve requested timezone plus normalized UTC", async () => {
    const start = new Date(Date.now() + 60_000); const end = new Date(start.getTime() + 60_000);
    const input: FixedCreateBatch = { ...request(2), mode: "scheduled", startAt: start.toISOString(), endAt: end.toISOString() };
    const batch = await repository.createBatch(input, dataset("future", 2));
    const leader = await acquire();
    expect(await repository.claim(leader)).toBeNull();
    expect(batch.timezone).toBe("Asia/Bangkok"); expect(batch.startAt).toBe(start.toISOString());
    expect(batch.jobs).toHaveLength(2);
    for (const [index, job] of batch.jobs!.entries()) {
      expect(Date.parse(job.scheduledAt)).toBeGreaterThanOrEqual(start.getTime() + index * 30_000);
      expect(Date.parse(job.scheduledAt)).toBeLessThan(start.getTime() + (index + 1) * 30_000);
    }
    const replay = await replica.createBatch(input, dataset("future", 2));
    expect(replay.jobs?.map((job) => job.scheduledAt)).toEqual(batch.jobs?.map((job) => job.scheduledAt));
    await repository.transition(batch.id, "cancel"); await release();
  });

  it("pause prevents final submit and resume retains the reserved row", async () => {
    const batch = await repository.createBatch(request(), dataset("paused", 1));
    const leader = await acquire(); const job = await repository.claim(leader);
    expect((await repository.transition(batch.id, "pause")).status).toBe("paused");
    await expect(repository.beforeSubmit(leader, job!)).rejects.toThrow("Paused before final submit");
    await repository.finish(job!, "failed", "A stopped driver cannot overwrite the pending row");
    expect((await repository.getBatch(batch.id)).counts.pending).toBe(1);
    expect(await repository.claim(leader)).toBeNull();
    expect((await repository.transition(batch.id, "resume")).status).toBe("running");
    const resumed = await repository.claim(leader); expect(resumed?.id).toBe(job?.id);
    await repository.finish(resumed!, "failed", "Fixture pre-submit error");
    expect((await repository.getBatch(batch.id)).status).toBe("attention");
    expect(await repository.availableCount([job!.row.id])).toBe(1);
    await release();
  });

  it("cancel cancels pending rows and stops active pre-submit work", async () => {
    const batch = await repository.createBatch(request(2), dataset("cancelled", 2));
    const leader = await acquire(); const job = await repository.claim(leader);
    const cancelled = await repository.transition(batch.id, "cancel");
    expect(cancelled.counts.cancelled).toBe(1); expect(cancelled.counts.running).toBe(1);
    await expect(repository.beforeSubmit(leader, job!)).rejects.toThrow("cancelled before final submit");
    await repository.finish(job!, "failed", "A stopped driver cannot overwrite cancellation");
    const result = await repository.getBatch(batch.id);
    expect(result.status).toBe("cancelled"); expect(result.counts.cancelled).toBe(2);
    expect((await repository.transition(batch.id, "cancel")).status).toBe("cancelled");
    await expect(repository.transition(batch.id, "resume")).rejects.toThrow("terminal");
    await release();
  });

  it("cancel cannot recall an already-started final submit or release its reservation", async () => {
    const batch = await repository.createBatch(request(), dataset("after-boundary", 1));
    const leader = await acquire(); const job = await repository.claim(leader);
    await repository.beforeSubmit(leader, job!); await repository.transition(batch.id, "cancel");
    await repository.finish(job!, "uncertain", "Fixture confirmation lost");
    const result = await repository.getBatch(batch.id);
    expect(result.status).toBe("cancelled"); expect(result.counts.uncertain).toBe(1);
    expect(await repository.availableCount([job!.row.id])).toBe(0);
    await release();
  });

  it("a window expiring during form filling blocks the final submit", async () => {
    const batch = await repository.createBatch(request(), dataset("expires-during-fill", 1));
    const leader = await acquire(); const job = await repository.claim(leader);
    await sql.query("UPDATE fixed_batches SET start_at = now() - interval '2 hours', end_at = now() - interval '1 hour' WHERE id = $1", [batch.id]);
    await expect(repository.beforeSubmit(leader, job!)).rejects.toThrow("expired before final submit");
    await repository.finish(job!, "failed", "Stopped driver cannot change terminal expiry");
    const result = await repository.getBatch(batch.id);
    expect(result.counts.expired).toBe(1); expect(result.status).toBe("attention");
    await release();
  });
});
