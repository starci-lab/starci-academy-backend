---
{
  "schema": "work/node@1",
  "id": "nivo.chatbot.uat.telegram-conversation.ux",
  "kind": "uat.ux",
  "required": true,
  "assertions": [
    "chatbot-telegram-live-conversation-behavior",
    "chatbot-telegram-handoff-fences-automation",
    "chatbot-telegram-failed-reply-retry-behavior",
    "chatbot-telegram-history-persists-after-reload"
  ],
  "state": "suspended",
  "suspensionReason": "No current end-to-end TINO run proves live Telegram ingress/reply, browser handoff, failed-reply retry, or persistent reload behavior."
}
---
# Telegram conversation UX

## Candidate behavior
- Send a fixture message through the real Telegram route and observe exactly one ordered inbound ledger row plus the truthful reply result.
- Drive human handoff in the UI and verify later automation/provider work is fenced; resolve only with current authority.
- Induce an approved pre-provider failure, drive the failed-reply retry control, and verify prior attempt information remains while exactly one logical reply proceeds.
- Re-send/replay the same provider event and reload the browser; verify no duplicate message and stable sequence, handoff, and delivery state.
- If provider dispatch has started and the outcome is unknown, verify `ambiguous` and explicit reconciliation instead of blind retry.

## Known blocker
The backend/Core retry operation exists, but the inspected frontend has no retry action. This behavior cannot pass until the UI path is implemented and approved.

## Done when
Actual provider, browser controls, negative states, and reload/readback are captured with current served-version evidence and isolated fixture identity.
