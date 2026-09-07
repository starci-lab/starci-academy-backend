---
{
  "schema": "work/node@1",
  "id": "nivo.accounting.uat.setup-test-apply.ux",
  "kind": "uat.ux",
  "required": true,
  "state": "suspended",
  "suspensionReason": "No fresh browser-driven TINO run proves Accounting setup, exact test, apply gating, persistence, and recovery for the owner fixture.",
  "assertions": [
    "accounting-setup-owner-can-complete-required-gates",
    "accounting-exact-test-gates-current-draft",
    "accounting-apply-activates-tested-context",
    "accounting-setup-reload-preserves-active-context"
  ]
}
---
# Setup/test/apply UX

## Candidate acceptance

Drive the rendered owner controls to complete approved setup facts, run the required exact acceptance scenario against the current draft, verify apply is unavailable or refused without current proof, apply the tested context, and reload to confirm the same active context. Record control-level failures and recovery without substituting API calls for the UI actions.

## Done when

Behavior evidence identifies every driven control and proves the digest/generation gate, accepted apply, active-context readback after reload, and at least one meaningful refusal/recovery path on the observed TINO build.
