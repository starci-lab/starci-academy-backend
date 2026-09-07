---
{
  "schema": "work/node@1",
  "id": "nivo.chatbot.uat.setup-test-apply.ui",
  "kind": "uat.ui",
  "required": true,
  "refs": [
    "design.chatbot-workbench"
  ],
  "assertions": [
    "chatbot-setup-test-apply-ui-states-observed",
    "chatbot-setup-test-apply-ui-design-reviewed"
  ],
  "state": "suspended",
  "suspensionReason": "Chatbot visual direction is not approved and no current TINO browser images are bound to the actual served build."
}
---
# Setup, Test, and Apply UI

## Candidate observations
Inspect the Setup conversation/revision state, requirement completeness and confirmations, Test scenario/evidence state, Apply control, approved-version readback, pending feedback, refusal/failure recovery, and responsive composition at approved viewports/themes.

The imported frontend tests render shared Setup surfaces, but they do not establish visual fidelity or the actual TINO state.

## Done when
Current inspected images show every approved state and viewport against the approved design resource, with secrets and sensitive content redacted.
