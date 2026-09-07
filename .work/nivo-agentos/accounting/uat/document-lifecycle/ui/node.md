---
{
  "schema": "work/node@1",
  "id": "nivo.accounting.uat.document-lifecycle.ui",
  "kind": "uat.ui",
  "required": true,
  "state": "suspended",
  "suspensionReason": "Accounting workbench art direction is unapproved and no fresh TINO screenshots prove role-specific document, ledger, and period states on served builds.",
  "refs": [
    "design.accounting-workbench"
  ],
  "assertions": [
    "accounting-document-status-ui-visible",
    "accounting-role-specific-actions-ui-visible",
    "accounting-posted-ledger-ui-visible",
    "accounting-closed-period-ui-visible"
  ]
}
---
# Document lifecycle UI

## Observed source

`AccountingWorkbenchBlock/component.tsx` maps draft/owner to Submit, submitted/approver to Approve, and approved/owner to Post; it renders document status, signed ledger entries, period controls, context audit details, and command notices. Component tests exercise these projections without proving a deployed browser surface.

## Candidate acceptance

Capture the same document as it appears to the owner and distinct approver across submitted, approved, posted, and period-closed states. Verify only the eligible role/action is presented, state labels and ledger facts remain legible, and refusal/success notices are perceivable under approved visual criteria.

## Done when

Inspected screenshots from isolated actor contexts cover all four lifecycle states and relevant disabled/refused states on the observed TINO build.
