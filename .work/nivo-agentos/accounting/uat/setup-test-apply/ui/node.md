---
{
  "schema": "work/node@1",
  "id": "nivo.accounting.uat.setup-test-apply.ui",
  "kind": "uat.ui",
  "required": true,
  "state": "suspended",
  "suspensionReason": "Accounting art direction is unapproved and no fresh TINO screenshots bind the setup, exact-test, apply, and active-context states to observed served versions.",
  "refs": [
    "design.accounting-workbench"
  ],
  "assertions": [
    "accounting-setup-gates-ui-visible",
    "accounting-exact-test-status-ui-visible",
    "accounting-applied-context-ui-visible",
    "accounting-setup-ui-responsive-and-accessible"
  ]
}
---
# Setup/test/apply UI

## Observed source

Backend setup definition exposes ten labeled requirements and `payables-review`. Frontend `AgentOSSolutionModulePage/index.tsx` projects setup gate evidence and accepts an exact test only when its context/draft digest, definition digest, and authority/source/retrieval generations match. This does not show how the deployed TINO UI currently appears.

## Candidate acceptance

At approved viewports/themes, capture and inspect the required Accounting gates, exact-test target/status, apply availability/refusal, and active-context identity. Labels, states, focus, hierarchy, contrast, and responsive layout must follow approved design; screenshots must be bound to the actual served build.

## Done when

Fresh TINO image evidence covers the owner-visible before-test, passed-test, apply, and applied/readback states at approved visual criteria, including relevant refusal/loading states.
