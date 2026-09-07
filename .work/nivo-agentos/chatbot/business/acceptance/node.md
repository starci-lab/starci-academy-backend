---
{
  "schema": "work/node@1",
  "id": "nivo.chatbot.business.acceptance",
  "kind": "business",
  "required": true,
  "dependsOn": [
    "nivo.chatbot.business.functional",
    "nivo.chatbot.business.nonfunctional",
    "nivo.chatbot.business.rules"
  ],
  "assertions": [
    "chatbot-acceptance-model-approved",
    "chatbot-uat-flow-boundaries-approved",
    "chatbot-unresolved-decisions-visible"
  ],
  "state": "done",
  "completion": {
    "inputDigest": "321c306cd695a694fa3390532e2017386cf8d6e842b7bb7a9bc160c75a75867a",
    "evidence": [
      "nivo.chatbot.business.acceptance.review-20260908"
    ]
  }
}
---
# Acceptance model

## Candidate acceptance groups
1. Setup → exact acceptance Test → Apply, with applied-context readback and live serving still explicitly controlled.
2. Telegram live conversation → ordered transcript → human handoff → fenced automation → failed-reply retry → reload/readback, without rewriting ambiguous delivery as success.
3. Zalo OAuth/connect → active binding → signed live ingress and reply, with denial, expiry, replay, and configuration failures visible.
4. Two-install isolation → owner-scoped reads and commands → provider-account collision/transfer refusal → no cross-install mutation or data disclosure.

Each group is split into UI appearance and UX behavior evidence under `nivo.chatbot.uat`; source tests and historical task notes cannot satisfy those browser assertions.

## Acceptance constraints
- UAT must use the declared TINO environment, owner identity, isolated fixture namespace, and actual served frontend/backend versions.
- UI leaves require inspected image evidence at approved viewports and design authority where applicable.
- UX leaves require driven behavior, reload/readback, and negative authorization/failure observations.
- Exact expected copy, viewports, provider test identities, fixture reset, and measurable NFR thresholds remain owner decisions.

## Done when
The owner approves this model and every required expected outcome is precise enough to distinguish pass, fail, and inconclusive without inventing provider behavior.
