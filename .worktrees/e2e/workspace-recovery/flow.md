# e2e flow — workspace-recovery

The API journey of the AgentOS workspace auto-recovery feature, run by the repository's own live e2e lane as a client of the
served core. Drafted by `api.verify` of session `20260905-131026-nivo-recovery-e2e`; the browser flow of the same name under
`.worktrees/uat/workspace-recovery` holds the account record and the seed this run walks on.

## Suite

| Field | Value |
| --- | --- |
| Command | `npm run test:e2e:live -- --testMatch "**/agentos-workspace-recovery.live-spec.ts"` (package.json#scripts.test:e2e:live, the live lane) |
| Files | `src/tests/e2e/nivo/agentos-workspace-recovery.live-spec.ts` |
| Gate values | NIVO_RECOVERY_LIVE_OWNER_USERNAME, NIVO_RECOVERY_LIVE_STRANGER_USERNAME, NIVO_RECOVERY_LIVE_PASSWORD (resolved by name at the run, never recorded), NIVO_RECOVERY_LIVE_NAMESPACE, NIVO_RECOVERY_LIVE_WORKSPACE_UNPROVISIONED, NIVO_RECOVERY_LIVE_WORKSPACE_HEALTHY, NIVO_RECOVERY_LIVE_WORKSPACE_DUE; NIVO_CORE_GRAPHQL_URL |

## Served route

`nivo/be` on `http://127.0.0.1:3068/graphql`, the entry the platform receipt attests; Keycloak realm `nivo` at `http://localhost:8147`, public client `nivo-web`.

## Namespace

`uat-workspace-recovery-<runId>`: the seed the browser flow's `seed/` places for one run, twelve rows by exact id, rolled back by the seed's own `rollback.sql` after the run read them back.

## Cases

control-centre-null-instance, recover-not-owner-refused, recover-owned-admitted, core-failure-reversed, recover-healthy-fenced, namespace-clean — each an `it` of the spec, named by its case id.

## Runs

`runs/<runId>/result.json` and the runner's own output beside it; `latest.json` names the newest run; `history.md` keeps one line per run.
