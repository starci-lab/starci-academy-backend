---
{
  "schema": "work/node@1",
  "id": "nivo.chatbot.business.nonfunctional",
  "kind": "business",
  "required": true,
  "assertions": [
    "chatbot-nfr-measures-approved",
    "chatbot-resilience-and-privacy-boundary-approved"
  ],
  "state": "done",
  "completion": {
    "inputDigest": "38c7b7c9e974db4d39a6bfc8bbc5b30668f230453996fc1a7efd313364baaab3",
    "evidence": [
      "nivo.chatbot.business.nonfunctional.review-20260908"
    ]
  }
}
---
# Non-functional requirements

## Observed source mapping
- Channel activation and provider delivery use durable outboxes, bounded retries, generation checks, and explicit ambiguous outcomes under `apps/agentos-controlplane/src/chatbot/`.
- `chatbot-history-snapshot.service.ts` checks ordered message history and fences a sequence gap into human handoff.
- `chatbot-channel-binding.service.ts` accepts opaque `sealed://` or `env://` credential references rather than plaintext provider material.
- The current workbench query returns all conversations and messages for an installation; no pagination contract is visible in `chatbot.resolver.ts` or the frontend API.

## Candidate intent requiring measures
- Correctness: installation, owner, authority epoch, generation, request token, and message sequence remain consistent through retry and reload.
- Reliability: pre-provider failures may retry; post-provider uncertainty stays ambiguous until authorized reconciliation; no duplicate-send claim exceeds provider evidence.
- Privacy and security: secrets never cross the browser contract; stored evidence and UI copy do not reveal credentials or sensitive provider payloads.
- Operability: recovery, backup/restore, audit, and failure states are inspectable without treating source HEAD as served-build proof.
- Experience and scale: responsive, accessible UI and bounded data reads need explicit target viewports, assistive expectations, latency, history volume, pagination, and retention thresholds.

## Unknowns
No approved numeric SLO, dataset size, retention duration, RPO/RTO, accessibility level, or provider-rate budget was found. These must be decided before this leaf can pass.

## Done when
Each NFR has an owner, measurable threshold, observable verification method, and explicit failure handling.
