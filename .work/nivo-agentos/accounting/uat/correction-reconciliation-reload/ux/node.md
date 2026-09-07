---
{
  "schema": "work/node@1",
  "id": "nivo.accounting.uat.correction-reconciliation-reload.ux",
  "kind": "uat.ux",
  "required": true,
  "state": "suspended",
  "suspensionReason": "No fresh browser-driven TINO evidence proves later-period correction, distinct approval, currency-scoped reconciliation, or reload/as-of persistence.",
  "assertions": [
    "accounting-owner-submits-later-period-correction",
    "accounting-distinct-approver-approves-correction",
    "accounting-owner-reconciles-current-ledger",
    "accounting-correction-and-reconciliation-survive-reload",
    "accounting-as-of-read-excludes-later-correction",
    "accounting-correction-self-approval-is-refused"
  ]
}
---
# Correction and reconciliation UX

## Candidate acceptance

Drive a non-zero correction proposal against an eligible source entry in a later open month, refuse owner/self approval, approve in the distinct approver context, reconcile the resulting currency-scoped current ledger, reload, and compare current state with the pre-correction as-of version. Confirm success is announced only after workbench and applied-context readbacks settle.

## Done when

Behavior evidence proves the actor handoff, later/open-period gate, single appended correction successor, reconciliation high-water and difference, reload persistence, and historical exclusion on the actual served build.
