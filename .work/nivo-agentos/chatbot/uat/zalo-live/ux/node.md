---
{
  "schema": "work/node@1",
  "id": "nivo.chatbot.uat.zalo-live.ux",
  "kind": "uat.ux",
  "required": true,
  "assertions": [
    "chatbot-zalo-oauth-and-binding-behavior",
    "chatbot-zalo-live-conversation-behavior",
    "chatbot-zalo-negative-security-behavior",
    "chatbot-zalo-state-persists-after-reload"
  ],
  "state": "suspended",
  "suspensionReason": "No current browser/provider TINO run proves Zalo OAuth, activation, signed live traffic, negative security cases, and reload/readback."
}
---
# Zalo connect and live UX

## Candidate behavior
- Drive Connect Zalo, provider consent, callback, and installation-scoped active binding readback without exposing credential material.
- Send a live fixture message and observe signed ingress, one ordered conversation entry, and the truthful reply outcome.
- Verify denial, replay/expiry, OA mismatch, forged MAC, inactive binding, and provider uncertainty fail closed with recoverable feedback.
- Reload and verify the same active binding, conversation sequence, and delivery state.

## Done when
The browser/provider run records each driven control and provider observation with current served-version provenance and no secret-bearing artifact.
