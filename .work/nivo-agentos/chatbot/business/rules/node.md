---
{
  "schema": "work/node@1",
  "id": "nivo.chatbot.business.rules",
  "kind": "business",
  "required": true,
  "assertions": [
    "chatbot-authority-rules-approved",
    "chatbot-delivery-and-handoff-rules-approved",
    "chatbot-provider-ownership-rules-approved"
  ],
  "state": "done",
  "completion": {
    "inputDigest": "40388692594ce6b75f98032f5b62e0d0e1494ba239f35e3388adcce1d7909f3c",
    "evidence": [
      "nivo.chatbot.business.rules.review-20260908"
    ]
  }
}
---
# Business and safety rules

## Observed source rules
- Setup declares owner confirmation for each required area and exact acceptance scenarios before apply.
- Setup projection binds context, definition, source, retrieval, authority generations, and accepted test receipts; projection does not enable live delivery.
- Active ingress requires a channel binding and a primary-authority start; duplicate provider events are read back as replay.
- Handoff cancels pending provider sends, refuses resolution on a stale authority epoch, and refuses handoff changes while a provider send is ambiguous.
- Failed reply retry requires automated handoff state and live authority; provider-start uncertainty becomes `ambiguous` and requires explicit reconciliation.
- A provider account already owned by another installation is rejected with an explicit-transfer requirement.

## Candidate rules requiring approval
- Grounded answers, safe fallback, conflicting-source handoff, prohibited-commitment refusal, PII handling, channel style, language handling, and stale-source ineligibility use the manifest scenarios as a review checklist, not accepted policy text.
- A Telegram bot or Zalo OA has one active installation owner unless a separately authorized transfer workflow proves fencing and readback.
- “Exactly once” is limited to local idempotency/ledger guarantees; provider delivery is reported according to evidence as pending, sent, failed, cancelled, or ambiguous.
- Human handoff is a hard automation fence until a current authorized resolution succeeds.

## Unknowns
The real conflict owner, retention owner, handoff queue, transfer approver, supported claims, prohibited actions, and recovery escalation are not defined by the code comments or fixtures.

## Done when
The owner approves the rules and negative cases, including provider ambiguity, stale authority, revoked knowledge, cross-install access, and transfer refusal.
