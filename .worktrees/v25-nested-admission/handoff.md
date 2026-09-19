# Nested admission and read-only probe candidate

Target: 2.5.0-rc.2. Baseline: 3d15e85da4b46301ed77796d03296dbf843ac071.
Root owns live adoption and publication. This candidate writes no product source or peer ledger.

The nested admission fix uses the existing accepted-input gate to bind a declared exchange to the
same session, current parent operator, retained mission invocation, parent goal/re-entry mapping,
accepted waiting checkpoint, declared awaited kind and exact parent input hashes. A child carries
no separate goal, resume or requirements and does not inherit the parent's unit/handoff fields.
An already-matched child can be verified after its parent resumes or completes only through its
exact frozen request, declared output and accepted evidence. Normal parent admission is unchanged.
Historical accept-phase validation still restores the retained invocation context; it does not
turn an old child into current dispatch authority after a mission correction.

The runtime collector sends one fixed non-secret `x-apollo-operation-name: StarCiRuntimeObservation`
header on GET and retains that request intent in each probe. The proof gate refuses missing or
altered headers. There is no arbitrary-header option, POST fallback or credential input. Existing
health status semantics remain 200–399 with redirects not followed. The paired registry, Git,
socket, lease, process and fresh HTTP checks are unchanged.

## Evidence

- `baseline-repro.log`: actual Accounting critique refused only PLAN_GOAL_UNBOUND and
  PLAN_REENTRY_UNBOUND on the published baseline.
- `actual-candidate-repro-final.log`: the same request validates read-only on the final candidate
  with exit 0, without changing any request or ledger file.
- `combined-focused.log`: 4/4 passed, including parent/child ownership, stale and forged proof,
  resumed/completed parent replay, strict ordinary parent mapping, and an isolated collector CLI
  server that rejects GET without the fixed operation header.
- `full-final.log`: the final exact-candidate npm test; final completion/counts belong to this log.
  The candidate host uses a validated junction to the existing Source Playwright installation.
- Earlier failed logs remain. No publication or actual product UAT result is inferred from tests.

## After root publishes

Accounting keeps its existing nested request, absent goal and null resume. Its owner runs ordinary
`attempt-gate.mjs open` on the existing `step-26/parallel-1/critique` branch, then normal worker-slot
acquisition and independent review. No manual request hash or parent receipt edits are required.

Chatbot uses the same collector CLI and safe GET URLs. The fixed operation header is automatic.
Collect two fresh distinct observations after the published head, retain both addresses and finish
the ordinary no-op receipt/acceptance. No shared write lease or registry mutation is needed.

The manifest lists only the bounded candidate delta and exact before/after hashes. Both unrelated
finding ledgers are excluded; no deletion is authorized.
