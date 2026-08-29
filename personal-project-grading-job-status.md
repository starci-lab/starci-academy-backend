---
version: 1
project: starci-academy
role: be
approvedBy: Cuong (owner)
approvedOn: 2026-08-27
reason: Personal Project UI delivery proceeds before an authoritative review-job status read model exists.
scopes: product:personal-project, api:grading-job-status
---

# Personal Project grading-job status debt

## Current delivery boundary

- `reviewPersonalProjectTask` accepts an immutable submission and returns only `jobId`.
- The learner can query completed task attempts, but cannot query the queued review job by `jobId`.
- The grading page therefore preserves `jobId` plus the completed-attempt baseline in the URL and polls completed attempts. It labels queued/processing progress as client-observed progress and does not claim backend authority.

## Consequences kept visible

- Reload or another device cannot recover the exact queued, processing, failed, or completed job state.
- A recoverable worker failure cannot expose an authoritative error reason or retryability contract.
- The UI cannot bind the completed attempt to the exact accepted job until the attempt list changes.

## Exit criteria

- Expose an enrollment-authorized read contract keyed by `jobId` with `queued`, `processing`, `failed`, and `completed` states.
- Return the linked attempt identity on completion; return safe failure reason, retryability, and `updatedAt` on failure/progress.
- Preserve idempotency and ownership checks across enqueue, retry, reload, and cross-device reads.
- Replace baseline polling in the frontend grading page with the authoritative job read model, then rerun Personal Project visual fidelity and product UAT.

## Progress

- 2026-08-27: debt recorded after the approved Personal Project Command Center interface was implemented and runtime-checked; backend realization is intentionally deferred by owner instruction.
