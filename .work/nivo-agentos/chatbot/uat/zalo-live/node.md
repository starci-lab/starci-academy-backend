---
{
  "schema": "work/node@1",
  "id": "nivo.chatbot.uat.zalo-live",
  "kind": "uat.ux",
  "required": true
}
---
# Zalo connect and live flow

## Candidate journey
Start Zalo OA authorization from the selected Chatbot installation, complete the provider callback through one-time state and PKCE, observe pending-to-active channel readback, then verify signed live ingress and a truthful reply outcome.

## Required negative coverage
Authorization denial, missing configuration, mismatched OA, expired/replayed state, forged webhook MAC, inactive authority, and provider-delivery ambiguity remain visible and do not expose tokens.

## Done when
The paired UI and UX leaves prove the approved Zalo connection and live-message journey on the current TINO build.
