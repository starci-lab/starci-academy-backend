# uat flow — module-setup

Draft prepared by `platform.operate` for the frozen Nivo `nivo/fe` route. It is a bounded static Setup inspection; the exact twelve-row historical seed is applied with account/prefix attribution and verified cleanup.

## Goal

An owner opens the custom module Setup surface for one dedicated fictional workspace and sees the historical completed revision beside the current open revision. The fixture proves persisted Setup history only; it does not claim payment, activation, provisioning, Test, Apply, callback, or live assistant success.

## Budgets

| Budget | Value | Why |
| --- | --- | --- |
| Steps | `5` | Sign in, open Setup, inspect history, inspect current revision, inspect inactive future actions |
| Time | `90s` | Bounded primary Setup inspection |
| Surface class | `console` | Frozen direction contract |
| Viewports | `1441x1000, 390x844` | Wide and compact Setup states |

## Cases

| Order | Case | As | Entry | Terminal assertion |
| --- | --- | --- | --- | --- |
| 1 | `setup-loads-owned-fixture` | `owner` | signed in at Setup for the seeded workspace | Exactly one owned generic-agent installation is shown |
| 2 | `history-shows-completed-revision` | `owner` | Setup at rest | Revision 1 is completed with five fields and three historical messages |
| 3 | `current-revision-shows-open-progress` | `owner` | Setup at rest | Revision 2 is open with three complete and two missing fields and three messages |
| 4 | `future-actions-remain-unrun` | `owner` | Setup at rest | No completed Test, applied context, callback or live reply result is claimed |

`As` names the `owner` alias in `accounts.dev.json`.

## Steps

| # | Action | Observation |
| --- | --- | --- |
| 1 | Sign in as `owner` and open the seeded workspace Setup entry | The owner identity and workspace are shown |
| 2 | Inspect the installation header and module identity | One generic-agent installation is present, `live_enabled=false`, `operating_mode=assist` |
| 3 | Open history and select revision 1 | Five fields, completed status, three historical messages and matching snapshot are shown |
| 4 | Select current revision 2 | Three fields are complete, `trigger` and `guardrail` are missing, and three messages are shown |
| 5 | Inspect available actions without invoking them | No Test, Apply, callback or live reply result is represented |

## Alternate paths

| Trigger | Path | Expected result |
| --- | --- | --- |
| Compact viewport | Repeat steps 2–5 at `390x844`, using the Setup panel overflow control | The same persisted values remain visible and no action is invoked |
| Revision 1 selected from history | Return to revision 2 through the history control | The current open revision remains unchanged |
| Missing or ambiguous owner/workspace | Stop the case before action | Record an evidence gap; do not create or repair rows during UAT |

## Assertions

| Assertion | Case | Lane | What is observed |
| --- | --- | --- | --- |
| `owned-workspace-loaded` | `setup-loads-owned-fixture` | `behavior` | Dedicated workspace and exactly one generic-agent installation load for the owner |
| `history-complete` | `history-shows-completed-revision` | `behavior` | Revision 1 is completed with five fields and three messages |
| `current-open` | `current-revision-shows-open-progress` | `behavior` | Revision 2 is open with three complete and two missing fields and three messages |
| `future-actions-unrun` | `future-actions-remain-unrun` | `behavior` | Test, Apply, callback and live reply result are absent or disabled |

## Fixtures

| Record | Source | Namespace | Created by |
| --- | --- | --- | --- |
| order, workspace, installation | `seed/records.json` | `uat-module-setup-042915-26` | `seed` |
| two Setup sessions and one context version | `seed/records.json` | `uat-module-setup-042915-26` | `seed` |
| three messages per Setup session | `seed/records.json` | `uat-module-setup-042915-26` | `seed` |

## Cleanup

Rollback deletes only the twelve identifiers listed in `seed/records.json`, in its explicit child to parent order, after rechecking the recorded account ownership or exact identifier prefix, row fingerprints and external dependencies. No other session, account, run, or shared row is touched.
