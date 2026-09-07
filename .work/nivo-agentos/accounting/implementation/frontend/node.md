---
{
  "schema": "work/node@1",
  "id": "nivo.accounting.implementation.frontend",
  "kind": "implementation",
  "required": true,
  "state": "suspended",
  "suspensionReason": "Frontend workbench code and component tests exist, but art direction is unapproved and no Work 3 implementation evidence is bound to the inspected commit.",
  "dependsOn": [
    "nivo.shared.implementation.frontend",
    "nivo.accounting.implementation.backend"
  ],
  "refs": [
    "repo.nivo-frontend",
    "design.accounting-workbench"
  ],
  "assertions": [
    "accounting-frontend-workbench-contract-implemented",
    "accounting-frontend-owner-approver-controls-implemented",
    "accounting-frontend-recovery-readback-implemented",
    "accounting-frontend-approved-design-implemented"
  ]
}
---
# Frontend implementation

## Observed source

Frontend HEAD is `f234d1abe6dd8f59fa4031959f8c55934e8997b0`. `AccountingWorkbenchBlock` connects installation-scoped queries and nine mutations, projects role/state-specific actions, reads evidence files, converts localized amounts to minor units, supports current/as-of reads, waits for workbench and context readback before announcing success, and renders refusal/retry states. Unit/component tests were inspected but not executed by this migration authoring step. `docs/visual-direction/accounting-workbench.png` exists, but its approval is not established.

## Candidate delivery

After design approval, verify the connected workbench against the approved API and role rules across loading, empty, refusal, recovery, current, and historical states. Preserve installation-qualified cache keys and require actual rendered evidence for visual assertions.

## Done when

The frontend assertions pass at the bound full commit, approved art direction is implemented at declared viewports/themes, and actual rendered/interaction evidence covers the required states.
