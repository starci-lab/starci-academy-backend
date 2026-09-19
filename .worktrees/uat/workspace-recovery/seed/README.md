# uat seed — workspace-recovery

Placed by `data.seed` of session `20260905-150800-nivo-operations-fix (redrafted from the 20260905-131026 seed with a fresh namespace and id prefix 1508)` against the primary PostgreSQL of nivo/be (`nivo-postgres`, database `nivo`) through the container's own `psql`, the store's declared connection, with the credentials resolved by name inside the container and never printed. Every row belongs to the flow's owner account (`uat-workspace-recovery-owner-131026`, users.id `f7350543-e1f9-429e-8ed5-0381940e777c`) where the store has an owner column (`catalog_orders.user_id`, `instances.owner_id`, `agent_workspace_recoveries.owner_id`, `jobs.user_id`) and carries the unit prefix `1508xxxx-0905-4268-aa15-000000000150` in its id plus the namespace in its name where it has none (`agent_workspaces`). Shared reference rows (the catalog item `nivo-ai-agent`, its `agent_basic` tier, the provisionable app `agentos`, the `start` plan) are only referenced, never written.

## What is placed

`records.json` lists the twelve rows in insertion order; `apply.sql` inserts them in one transaction; `verify.sql` counts every row by exact id (and owner where the store has one); `expectation.json` states the expected state; `rollback.sql` deletes the twelve ids in reverse order and nothing else. The seed places the preconditions of the flow — an owned workspace with no instance, an owned healthy workspace with a healthy recovery row, an owned suspended workspace with a stopped-but-due recovery row and its completed provisioning job — and never the outcome under test (no operation, no Core answer, no recovered state).

## Idempotency and rollback

Applying over the same namespace a second time is refused by the primary keys and changes nothing (`SEED_ALREADY_APPLIED`); a fresh namespace is a fresh runId. `rollback.sql` is the whole rollback set. `fingerprint.txt` is the sha256 of `records.json`, written by the operator.

## Where the data state comes from

`verify.sql` through the store's own `psql`; the suite reads the same rows back through the API (the control centre and the operations history), which is what `api.verify` judges its data lane on.

Namespace: `uat-workspace-recovery-20260905-082130-793eaad` (the flow's prefix plus the runId of the API run that walks on it).
