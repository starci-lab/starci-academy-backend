# Read-only runtime reuse candidate

Target: 2.5.0-rc.1. Baseline: 1d3c6bfe1b406bac9d94b114bf715c90be41cfde.
The 12-path manifest records exact current live before hashes and candidate after hashes. No files
are deleted; both unrelated finding ledgers are excluded. This candidate has not been published.

## Verification

- `related-isolated-final.log`: default parallel Node runner, 2/2 passed, zero skips. The new test
  installs its own temporary runtime payload and host; it does not create or remove Source tooling.
  It exercises the real collector subprocess, open/accept, retained proof, and complete preflight
  re-entry without crediting the future delivery runtime. Negative cases cover malformed/missing
  timestamps, forged source/socket identity, failed/stale probes, relevant lease filename variants,
  invalid registry fingerprint/generation/PID, missing paired proof, and mutation/no-op separation.
- `operator-final.log`: existing runtime operator self-test passed 14 valid branches and 50 rejected
  mutations, plus actual integration merge/provenance checks.
- `gates-final.log`: operator, template, resource, generated index/brief and 76 generated docs pass.
- No full npm suite is claimed. Version/lineage and corresponding docs were updated after E2E;
  final gates cover that documentation-only change. Prior failure logs remain intact. The shared
  host test cleanup race was fixed with an isolated host, not hidden by serial-only execution.

## Owner collection after adoption

Keep the existing open request and its invocation context unchanged. Use two new distinct labels
and collect both observations after the published validator is available:

```text
node <Source>/.claude/scripts/runtime-observation.mjs <open-runtime-branch> noop-before <safe-GET-URL-for-each-declared-origin>
node <Source>/.claude/scripts/runtime-observation.mjs <open-runtime-branch> noop-after <same-GET-URLs>
```

This writes only the invocation's `response/artifacts/`. It never creates/removes a shared lease or
updates the registry. An endpoint that rejects bare GET needs a safe read-only GET query under the
same declared origin; do not use mutation requests or credential-bearing URLs. The collector reads
the serving worktree explicitly recorded by the registry, measures Git HEAD/ancestry, the OS socket
owner, live processes and fresh HTTP responses. Missing ownership/source proof refuses collection.

Put the two returned `{ref, sha256}` addresses in `delta.noOpProof.before` and `.after`. Set
`inventoryFingerprint` to their identical raw registry hash and `generation` to the target entry's
generation (not the global registry counter). Use convergence `already-converged`, empty
`appliedEffects` and `mutations`, reused head, null integration and lease, and no new `changes`.
The exact check set is `entry-declared`, `endpoints-served`, `head-observed`, `generation-unchanged`,
`server-pid-owned`, `lease-unheld`. Record response `actual.observedAt` after both captures, and bind
the checks/receipt to those actual artifacts. Do not claim generation advancement or lease acquisition.

Run ordinary response/step validation and `attempt-gate accept`; acceptance repeats live checks.
If the registry changes or a relevant lease appears, refresh the truthful observations rather than
inventing a mutation or forcing admission. Accepted historical evidence later replays its manifest
without requiring the runtime to remain at the old generation.

The previous single Chatbot observation is not sufficient for this pair. Invocation contexts retain
request, mission, choices and forecast; they do not pin validator binaries. This response extension
uses the current validator without rebinding or rewriting the original frozen request.

## Explicit limits and separate finding

The no-op validator checks a precisely bounded projection of the target registry fields against the
owning schema while hashing the entire unmodified registry document. It does not normalize or amend
the live registry. Existing producer metadata outside that schema (including serving worktree metadata)
is a separate registry producer/schema alignment finding, not permission to accept arbitrary malformed
bound fields or to rewrite historical records. Mutation admission remains unchanged.
