---
{
  "schema": "work/node@1",
  "id": "nivo.accounting.uat.correction-reconciliation-reload.ui",
  "kind": "uat.ui",
  "required": true,
  "state": "suspended",
  "suspensionReason": "Accounting workbench art direction is unapproved and no fresh TINO screenshots bind correction, reconciliation, current, and historical states to served versions.",
  "refs": [
    "design.accounting-workbench"
  ],
  "assertions": [
    "accounting-correction-proposal-ui-visible",
    "accounting-correction-approval-ui-visible",
    "accounting-reconciliation-ui-visible",
    "accounting-current-and-as-of-ui-distinct"
  ]
}
---
# Correction and reconciliation UI

## Observed source

The workbench renders eligible source-entry selection, later-month and signed-delta inputs, a correction reason, pending proposals, role/period-sensitive approval affordances, reconciliation inputs/history, and a warning badge/advisory for as-of mode. These source projections are not rendered TINO evidence.

## Candidate acceptance

Capture pending and approved correction lineage, the appended correction ledger row, reconciliation values at its high-water, and current versus historical views. Verify action availability, audit detail, warnings, loading/refusal states, and readable signed currency values under approved visual criteria.

## Done when

Fresh inspected images cover the actor-specific pending/approved states, reconciliation result, and visibly distinct current/as-of readbacks on the observed TINO build.
