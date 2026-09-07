# Legacy module Setup UAT — sanitized historical summary

This resource preserves a minimal, non-promoting record of the legacy `module-setup` UAT tree. The original tree remains in place.

## What was recovered

The latest recorded run, `20260906-005807-5eec15c`, was traced to its response directory under the allowed `.worktrees` root. Its wide and compact screenshots were visually inspected and copied because they show only the fictional Setup fixture and product UI. Their copied hashes match the source hashes recorded in `inventory.json`.

The run recorded frontend commit `5eec15cfa4664b95b7980aba3f03e74a95d55f21`, frontend served head `edeb1c044de71f200077c019738cdc9cdd47556a`, backend commit `793eaad87513b32c799070a416fb30565c27c340`, and backend served head `9693eee1dc3da4c4af7c0d20f979b59a0273126e`. Its historical lane verdicts were behavior `pass`, UI `pass`, and UX `fail` / experience `fix-first`. These are source observations, not fresh acceptance results.

Identity is retained only as the `owner` alias, `customer` role, `nivo/fe` identity, and `sealed-shared-master-identity` custody classification. No username, provider identifier, credential reference, secret bytes, database row, or seed record is copied.

## Why no Work 3 evidence manifest was created

The current leaf `nivo.shared.uat.setup-test-apply-rollback.ux` requires setup, exact test-generation gates, Apply, rollback, refusal behavior, and persistence across reloads. The legacy flow says it is a bounded static Setup inspection and explicitly does not claim Test, Apply, activation, callback, live reply, or related mutation results. Its audit coverage is also recorded as `incomplete`, with no approval.

Attaching this material as evidence for that leaf would overstate its scope even with an `inconclusive` outcome. It is therefore preserved only as a historical import resource; the node state and completion metadata are unchanged.

## Missing references and retention

Exact-name search, including ignored and hidden files, recovered the selected run's referenced response captures. Equivalent referenced response artefacts for the three earlier legacy result records were not found within `D:/Repositories/starci-academy-backend/.worktrees`.

Decision: **KEEP** the original legacy tree. The selected run records `cleanupPerformed=false`, older result references remain unresolved, and the source retains non-imported custody material that this sanitized resource intentionally excludes.
