---
{
  "schema": "work/node@1",
  "id": "nivo.chatbot.uat.setup-test-apply",
  "kind": "uat.ux",
  "required": true
}
---
# Setup, Test, and Apply flow

## Candidate journey
Sign in as the declared owner, open the selected Chatbot installation, complete an owner-confirmed Setup revision using attributable source/retrieval inputs, run the exact required acceptance scenarios, apply only that tested context, and read back the approved version while live serving remains a separate explicit state.

## Required negative coverage
Incomplete requirements, missing owner confirmation, stale source/retrieval/authority generation, a failed or missing scenario, and an old projection must not apply.

## Done when
The paired UI and UX leaves prove the approved candidate journey on the current served build without treating fixture data or source tests as UAT.
