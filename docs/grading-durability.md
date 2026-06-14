# Grading-job durability — happy path, edge cases & where they live

This maps every failure mode of the async grading pipeline (challenge git/google-docs,
CV review, milestone review, AI-lab eval) to the code that handles it, after the durability
refactor (`processors/ai/*`, idempotency keys, fencing, V2-only).

## Lifecycle

```
Enqueue ──► Queued ──► Running: Grade (LLM) ──► Running: Complete ──► Completed ✓
   │            │              │                       │                    
   │            └─ claim       └─ heartbeat            └─ atomic tx          
   │               fence++        (lock renew)            idempotencyKey     
   └─ .catch→failJob                                                         
                                                          └──► Failed / DLQ ✗ (poison)
```

- **Recovery** is owned by BullMQ (lock + `stalledInterval` + `maxStalledCount` → `failed`,
  plus `attempts`/backoff). The custom Postgres `queueAt` sweeper was removed.
- Exactly-once *effects* come from `idempotencyKey` (one attempt per job) + a single
  transaction, not from exactly-once delivery.

## Case → implementation

| # | Case | Handled by | Where |
|---|------|-----------|-------|
| 1 | Happy path (claim → grade → complete → done) | our code | `worker.ts` loop + `*-complete-step.service.ts` |
| 2 | Worker dies mid-grade | BullMQ | `bullmq.module.ts` (`stalledInterval`/`maxStalledCount`); grade step re-runnable |
| 3 | Worker dies mid-complete (double-charge / dup attempt) | our code | `*-complete-step.service.ts`: attempt+credit+XP+`increaseJob` in **one tx**, `idempotencyKey = job.id` (`@Unique` on the attempt entity) |
| 4 | Zombie (lease lost, then resumes) | our code | `JobActionService.processingJob` bumps `fencingToken`; `increaseJob`/`completeJob` guard on `expectedFencingToken`; complete-step catch swallows `JobFencedOutException` (tx rolled back) |
| 5 | Slow-but-alive (lease/heartbeat) | BullMQ | worker `lockDuration` auto-renew |
| 6 | Poison job → DLQ | BullMQ | `attempts`+backoff → `failed`; DB `attempts`/`maxAttempts` for manual path |
| 7 | Broker `add` fails at enqueue | our code | `jobs/enqueue/*.service.ts`: `.catch(() => failJob(...))` |
| 8 | Duplicate enqueue | our code | `queue.add(id, payload, { jobId: job.id })` dedup |
| 9·10 | Reaper races / runs while alive | removed | custom sweeper deleted (`requeue.service.ts` gutted); BullMQ owns recovery |
| 11 | Mark-completed fails | our code | `worker.ts` `completeJob` + idempotency → safe re-run |
| 12 | LLM invoked then parse fails (free-usage leak) | our code | V2 grade step debits **right after invoke**, idempotent via `creditCharged` execution-result marker; complete step skips its debit when the marker is set |
| 13 | Re-drive from DLQ | our code | `JobStalledService.requeueJob` (reset status + bump fencing); idempotency makes re-run safe |
| — | Infinite single-execution loop (missing step) | our code | `worker.ts` throws `StepNotFoundException` instead of `?.process()` no-op |

## Key files
- Job core: `src/modules/bussiness/jobs/atomic/{job-action,job-stalled}.service.ts`
- Workers / steps: `src/features/api/processors/ai/<proc>/{*.worker.ts, steps/*-{grade,complete}-step.service.ts}`
- Enqueue: `src/modules/bussiness/jobs/enqueue/*.service.ts`
- Entities: `job.entity.ts` (`fencingToken`, `attempts`, `refs`), `*-attempt.entity.ts` (`idempotencyKey`), `xp-history.entity.ts`
- BullMQ config: `src/modules/bullmq/bullmq.module.ts`

## Invariants that must be kept by hand
1. Attempt write + `currentStep` advance in **one** transaction; `@Unique(["idempotencyKey"])` on the attempt entity.
2. Fencing CAS: `processingJob`/`requeueJob` bump the token; guarded writes pass `expectedFencingToken`.
3. Credit policy (#12): charge at LLM invoke, idempotent per job (marker), NOT per successful parse.
