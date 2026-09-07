---
{
  "schema": "work/node@1",
  "id": "nivo.chatbot.business.functional",
  "kind": "business",
  "required": true,
  "assertions": [
    "chatbot-functional-boundary-approved",
    "chatbot-functional-gaps-explicit"
  ],
  "state": "done",
  "completion": {
    "inputDigest": "8e1f72ee0e5b24a5e8dbe63e7c277d6669f3294ee92a54b287d5f6ec87a38127",
    "evidence": [
      "nivo.chatbot.business.functional.review-20260908"
    ]
  }
}
---
# Functional scope

## Observed source mapping
- `src/modules/bussiness/agentos-module-studio/catalog/multichannel-chatbot.ts` declares eleven Setup areas and nine required acceptance scenarios for `multichannel-chatbot`.
- `src/modules/bussiness/agentos-chatbot/chatbot-setup-registration.service.ts` projects an exactly accepted Setup context into Chatbot knowledge while leaving live serving disabled.
- `apps/agentos-controlplane/src/chatbot/chatbot.resolver.ts` exposes installation-scoped channel binding, Zalo authorization, handoff, delivery reconciliation, reply retry, and a workbench read model.
- `apps/app/src/components/blocks/agentos/ChatbotWorkbenchBlock/index.tsx` renders channels, conversations, ordered messages, handoff, Zalo connect, and ambiguous-delivery reconciliation.

These are observations at the source baseline, not proof that the business wants every behavior or that the complete journey works in TINO.

## Candidate intent requiring approval
- An owner can complete module Setup, test the exact candidate context, apply it, then separately enable and operate the installation.
- An authorized operator can connect supported channels, inspect installation-qualified conversations and messages, hand a conversation to a human, return it to automation under a current authority epoch, and recover failed or ambiguous delivery without a blind duplicate send.
- Telegram and Zalo journeys preserve provider-specific security and lifecycle differences while presenting truthful shared states.
- Two installations remain isolated for reads, commands, channel ownership, history, and mutable operations.

## Unknowns
The approved operator roles, handoff destination, supported customer intents, languages, channel rollout, provider-account transfer workflow, and owner-visible success/failure copy are not established by source alone.

## Done when
The owner approves the functional boundary and every unresolved source-to-intent interpretation is accepted, rejected, or explicitly deferred.
