---
{
  "schema": "work/node@1",
  "id": "nivo.chatbot.implementation.backend",
  "kind": "implementation",
  "required": true,
  "dependsOn": [
    "nivo.shared.implementation.backend"
  ],
  "refs": [
    "repo.nivo-backend"
  ],
  "assertions": [
    "chatbot-backend-contract-implemented",
    "chatbot-backend-authority-and-isolation-implemented",
    "chatbot-backend-recovery-paths-verified"
  ],
  "state": "done",
  "completion": {
    "inputDigest": "e47e4064aaa04b2aa96a71f7af370fc272ec0ee44e97a329f2df4002f3074a61",
    "evidence": [
      "nivo.chatbot.implementation.backend.review-20260908"
    ],
    "codeRefs": [
      {
        "repository": "repo.nivo-backend",
        "commit": "51248f75e0bf1c36a088afb57a04b2d7440a62c4"
      }
    ]
  }
}
---
# Backend implementation

## Observed implementation
- Manifest `multichannel-chatbot` is version `1.1.0`; the Studio manifest declares eleven Setup fields, semantic validators, nine acceptance scenarios, Chatbot Operations contracts, and registered widgets.
- Chatbot Setup projection verifies the active context/generation tuple and accepted scenario receipts before materializing the knowledge version without enabling live serving.
- Core owner gateway, controlplane resolver, provider binding/activation, OAuth, signed webhooks, ordered conversation history, handoff fencing, reply retry, provider ambiguity, reconciliation, backup/restore, and audit/outbox services exist in the backend checkout.
- Focused unit/container/e2e test files exist for these areas, including manifest gating, Setup projection, channel transfer refusal, signed ingress, owner-gateway refusal, ordered history, retry fencing, and provider ambiguity. Their existence is not a current passing test result.

## Known behavior gap
The workbench read is unpaginated and may load all installation messages. Exact production monitoring, provider-rate handling, backup/restore recovery targets, and an end-to-end served-runtime proof are not established by the inspected source.

## Candidate code scope
Retain Chatbot-specific behavior in the mapped backend paths, consume the shared Setup/Test contracts rather than forking them, and add only changes required by approved business/architecture decisions.

## Done when
A scoped backend commit is bound, focused and integration checks pass at that commit, unresolved gaps are fixed or explicitly accepted, and no credential or live-environment claim is inferred from test fixtures.
