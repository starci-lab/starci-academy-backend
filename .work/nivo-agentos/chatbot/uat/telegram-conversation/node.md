---
{
  "schema": "work/node@1",
  "id": "nivo.chatbot.uat.telegram-conversation",
  "kind": "uat.ux",
  "required": true
}
---
# Telegram conversation, handoff, retry, and reload

## Candidate journey
Use the declared sealed Telegram fixture for one selected installation, observe a signed live inbound event and ordered transcript, observe the automated reply outcome, move the conversation to human handoff, verify the automation fence, recover a controlled failed reply through the authorized retry path, and reload/read back the same history and state.

## Truth boundary
Local idempotency and provider delivery are separate claims. A provider-start uncertainty stays ambiguous until evidence-backed reconciliation; retry must not manufacture a second reply.

## Done when
The paired UI and UX leaves prove the approved live journey and negative cases on the current TINO build without persisting provider credentials in Work evidence.
