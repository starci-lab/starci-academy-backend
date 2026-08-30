# Mock interview + Flashcard task history summary

This checkpoint is a redacted process analysis, not a raw transcript. Message bodies, prompts,
reasoning, tool inputs/outputs, credentials and database rows are deliberately absent. The original
rollouts are bound by SHA-256 so the summary can be checked against the exact local source without
publishing sensitive content.

## Executive finding

Both tasks ran long because the loop mixed product discovery, source repair, runtime recovery,
fixture repair and visual review in one moving state. A later screenshot could invalidate an earlier
verdict, but there was no immutable capture matrix, no owner-partition reuse contract and no hard
circuit breaker. More review work therefore produced more artifacts without guaranteeing faster
convergence.

The dominant failure was process scope, not lack of screenshots:

1. capture began before data/runtime/scroll/zoom state was proven stable;
2. findings were repaired incrementally instead of as one owner-bound batch;
3. unrelated surfaces were repeatedly recaptured after local changes;
4. agent fan-out and context compaction multiplied recovery work;
5. PASS language sometimes appeared before the final post-mutation raster existed.

V7.2.1 addresses these failure modes with one Sol reviewer, deterministic capture preflight,
immutable matrix fingerprints, owner-partition invalidation, batched findings and a maximum of three
visual rounds. Round three may PASS or BLOCK; it may not silently start another repair loop.

## Task A — Redesign mock interview page

- Task: `01a05038-fbec-7553-9203-512809686d33`
- Interval: 2026-08-30 01:11Z → 05:55Z, about 4h43m.
- Scale: 11 turn contexts, 8 compactions, 843 execution calls, 11 agent spawns.
- Evidence: 448 files / 44.9 MB; filename rounds span r3–r15.
- Artifact churn: 285 `final-*` files, 30 `repair-*` files and 85 content-addressed files.

### What went wrong

- The review loop continued far beyond a useful three-round budget.
- Full viewport/state combinations were repeatedly regenerated instead of invalidating only the
  changed owner partition.
- Capture-readiness, repair, zoom, keyboard, compact and recovery evidence accumulated as parallel
  proof products; they did not share one frozen matrix identity.
- “Final” became a filename convention rather than a terminal contract—many later rounds still
  changed the supposed final state.

### What to keep

- Wide, compact, zoom, keyboard, loading and recovery probes were materially useful.
- The evidence contains enough state diversity to calibrate future strict visual review.
- The final source lineage is preserved in the FE/BE heads referenced by `manifest.json`.

### Recommended replay

1. Freeze one state/viewport matrix and owner map.
2. Run preflight once for data, skeleton, scroll, zoom and host readiness.
3. Round 1: one Sol discovers and batches all findings.
4. Repair once by affected owners; recapture only those partitions plus shared sentinels.
5. Round 2 verifies; round 3 is regression-only and then PASS/BLOCK.

## Task B — Tiếp tục flashcard hướng 1

- Task: `01a04cb0-efee-77c3-80e9-9e36b2ab5a54`
- Interval: 2026-08-29 08:44Z → 2026-08-30 04:44Z, about 20h.
- Scale: 48 turn contexts, 30 compactions, 3,073 execution calls, 14 agent spawns.
- Evidence: 59 screenshots / 4.8 MB; filename rounds span r1–r9.
- Covered families: hub 34, study 22, quiz 3.

### What went wrong

- Product-direction selection, FE implementation, backend/data diagnosis and browser recovery were
  interleaved in the same visual mission.
- The app runtime stopped or changed state during recapture, forcing browser reconnection and repeat
  screenshots.
- UAT data was not ready at capture time: an empty API collection conflicted with populated database
  state, so visual work paused for fixture and backend investigation.
- Preview handoff was briefly unavailable after its server was closed; the user could not inspect the
  proposed directions even though the producer had already reviewed them.
- Each mutation restarted too much of the visual matrix, and repeated compaction made the task spend
  work recovering context rather than closing one bounded round.

### What to keep

- The task found real cross-boundary failures that a CSS-only audit would have missed.
- Hub, Study, Quiz, empty, loading, recovery, wide and compact states were represented.
- Final FE refinements were published at `4e571af`; backend authority is at `2c84dd1e7`.

### Recommended replay

Split readiness from visual judgment. Backend/data or runtime instability must return to preflight,
not consume a visual round. Once ready, reuse the same immutable matrix and follow the same
three-round circuit breaker described above.

## Metrics interpretation

The counts in each `metrics.json` are safe structural facts. High call/evidence counts are not quality
scores. They show loop amplification. The useful optimization target is fewer invalidated owners and
fewer repeated states—not fewer strict checks.
