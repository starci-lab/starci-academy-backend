---
{
  "schema": "work/node@1",
  "id": "nivo.chatbot.architecture.api-events",
  "kind": "architecture",
  "required": true,
  "assertions": [
    "chatbot-api-contract-reviewed",
    "chatbot-event-authority-and-idempotency-reviewed",
    "chatbot-provider-ambiguity-protocol-reviewed"
  ],
  "state": "done",
  "completion": {
    "inputDigest": "7d237b384f8f08550f05f7597e0ac67fdce89f4c6079193e80b41e4091a60e13",
    "evidence": [
      "nivo.chatbot.architecture.api-events.review-20260908"
    ]
  }
}
---
# API and event architecture

## Observed API boundary
- `chatbot-workspace-gateway.service.ts` resolves the user-owned workspace and `multichannel-chatbot` installation before forwarding one closed GraphQL operation to the instance hostname.
- The gateway supports workbench, bind-channel, start-Zalo-OAuth, handoff set/resolve, reply retry, and delivery reconciliation. The controlplane resolver returns installation-qualified channels, conversations, and messages ordered by conversation and message sequence, with credential references redacted to `null`.
- The frontend `workspace-controlplane.ts` sends Chatbot browser traffic through Core rather than trusting a caller-supplied instance host.

## Observed event protocol
- Setup uses a primary projection outbox with event identity, aggregate sequence, definition/context digests, and authority/source/retrieval generations.
- Telegram and Zalo webhook controllers verify provider-specific authenticity, obtain a primary inbound-authority start, and only then call the controlplane ingress ledger.
- Inbound provider events are idempotent by binding/provider event and messages are unique by conversation sequence.
- Reply and provider outboxes fence handoff generation and live authority. Failures before provider start may retry; uncertainty after provider start becomes `ambiguous`; an authenticated reconciliation command records a terminal observation instead of blindly resending.

## Candidate gaps to close
- Define compatibility/version negotiation for Core ↔ controlplane GraphQL and event payloads.
- Define pagination/cursor and snapshot consistency for large workbench histories; the observed read model is currently unbounded.
- Define provider-specific delivery evidence, retry/reconciliation ownership, webhook replay window, monitoring, and failure escalation.
- Align the frontend operation union and rendered actions with backend `retry-reply`; the backend route exists but no frontend retry action was observed.

## Done when
Request, response, event, idempotency, ordering, authorization, retry, ambiguity, and compatibility semantics are reviewed with negative cases and consumers mapped.
