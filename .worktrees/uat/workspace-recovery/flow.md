# uat flow — workspace-recovery

The API journey of the AgentOS workspace auto-recovery feature, walked by the repository's own live e2e lane
(`src/tests/e2e/nivo/agentos-workspace-recovery.live-spec.ts`, `npm run test:e2e:live`) as a client of the served
core on 3068. Drafted by `identity.provision` of session `20260905-131026-nivo-recovery-e2e` from the tree's flow template; the
accounts are provisioned per alias, the seed is placed by `data.seed`, and the run records live under
`.worktrees/e2e/workspace-recovery`, the API flow's own home. Nothing here is a secret: a credential is named, never written.

## Goal

An owner's workspace that Core retains is recovered by the product on the owner's intent, a stranger is refused, a healthy
workspace is left alone, and a Core failure is recorded without moving the workspace.

## Budgets

| Budget | Value | Why |
| --- | --- | --- |
| Steps | `6` | One case per step: the control centre, the stranger, the intent, the Core answer, the fence, the namespace |
| Time | `300s` | Two scheduler observations (30 s each) cover one Core answer with margin; the suite polls, never sleeps a fixed time |
| Surface class | `console` | The control centre is the owner's console; the lane is an API client of it |
| Viewports | `n/a` | An API journey renders nothing |

## Cases

| Order | Case | As | Entry | Steps | Terminal assertion | Lanes asserted |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `control-centre-null-instance` | `owner` | `myAgentWorkspaceControlCenter` of the unprovisioned workspace | 1 | instance null, both apps unavailable with WORKSPACE_NOT_PROVISIONED, no recovery row | `behavior` |
| 2 | `recover-not-owner-refused` | `stranger` | the control centre, the intent and the history of the owner's due workspace | 3 | every call answers AGENT_WORKSPACE_NOT_FOUND_EXCEPTION and the owner's workspace is unchanged | `behavior` |
| 3 | `recover-owned-admitted` | `owner` | `manageAgentWorkspace(resume)` on the suspended due workspace | 2 | the intent is admitted (workspace active, recovery row no longer stopped) and Core answers it at its next observation | `behavior` |
| 4 | `core-failure-reversed` | `owner` | the control centre after the Core answer | 1 | a failure code stands on the recovery row, no replacement target was adopted, the workspace and its instance are unchanged, the next attempt is scheduled | `behavior` |
| 5 | `recover-healthy-fenced` | `owner` | the control centre of the healthy workspace before and after the Core answer | 1 | the healthy recovery row is untouched and no operation was created | `behavior` |
| 6 | `namespace-clean` | `owner` | every workspace of the namespace | 3 | each stands as the seed placed it apart from the one admitted intent, and no operation outside the recovery's own exists | `behavior` |

`As` names one alias of `accounts.dev.json`: `owner` owns every seeded row, `stranger` owns nothing.

## Assertions

| Assertion | Case | Lane | What is observed | Rule ids measured |
| --- | --- | --- | --- | --- |
| `null-instance-answered` | `control-centre-null-instance` | `behavior` | instance null, apps unavailable under WORKSPACE_NOT_PROVISIONED, recovery null | — |
| `stranger-refused` | `recover-not-owner-refused` | `behavior` | AGENT_WORKSPACE_NOT_FOUND_EXCEPTION on read, intent and history | — |
| `intent-admitted` | `recover-owned-admitted` | `behavior` | manageAgentWorkspace succeeds and the recovery row is read back with the Core answer | — |
| `failure-recorded-reversed` | `core-failure-reversed` | `behavior` | failureCode set, targetGeneration null, workspace and instance unchanged, nextAttemptAt in the future | — |
| `healthy-fenced` | `recover-healthy-fenced` | `behavior` | recovery row equal before and after, no operation | — |
| `namespace-clean` | `namespace-clean` | `behavior` | the three workspaces and their histories as seeded | — |

## Alternate paths

| Branch | Triggered by | Terminal assertion |
| --- | --- | --- |
| `core-admits` | an environment that declares a replacement target (AGENTOS_TARGET_*) | the recovery row reads scheduled, recovering or healthy after the Core answer; core-failure-reversed asserts the admission instead of a failure |

## Fixtures

| Record | Source | Created by | Namespaced |
| --- | --- | --- | --- |
| three catalog orders, three workspaces, two instances, two recovery rows, one completed provisioning job | `seed/records.json` | `seed` | ids `1310xxxx-0905-4268-aa15-000000000131`, namespace `uat-workspace-recovery-20260905-071250-8ff79ea` |
| the owner's resume intent | the run | `run` | on the seeded due workspace only |

## Steps

| # | As | Action | Expected | Evidence | UX ids measured |
| --- | --- | --- | --- | --- | --- |
| 1 | `owner` | read the control centre of the unprovisioned workspace | instance null, apps unavailable | `runs/<runId>/result.json` case control-centre-null-instance | — |
| 2 | `stranger` | read, resume and list the owner's due workspace | not found three times | `runs/<runId>/result.json` case recover-not-owner-refused | — |
| 3 | `owner` | resume the suspended due workspace and read it back until Core answers | admitted, then answered | `runs/<runId>/result.json` case recover-owned-admitted | — |
| 4 | `owner` | read the recovery row after the Core answer | failure recorded, nothing moved | `runs/<runId>/result.json` case core-failure-reversed | — |
| 5 | `owner` | read the healthy workspace again | untouched | `runs/<runId>/result.json` case recover-healthy-fenced | — |
| 6 | `owner` | read every workspace and history of the namespace | as seeded | `runs/<runId>/result.json` case namespace-clean | — |

## Cleanup

The namespace `uat-workspace-recovery-20260905-071250-8ff79ea`: the eleven seeded rows by exact id, removed by the seed's rollback after the
run read them back through the API. Run records under `.worktrees/e2e/workspace-recovery/runs/` are history and are never deleted.
