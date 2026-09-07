---
{
  "schema": "work/node@1",
  "id": "nivo.chatbot.uat.zalo-live.ui",
  "kind": "uat.ui",
  "required": true,
  "refs": [
    "design.chatbot-workbench"
  ],
  "assertions": [
    "chatbot-zalo-connect-ui-states-observed",
    "chatbot-zalo-live-transcript-ui-observed",
    "chatbot-zalo-ui-design-reviewed"
  ],
  "state": "suspended",
  "suspensionReason": "Chatbot visual direction is unapproved and no current TINO images prove Zalo authorization, binding, transcript, or failure states."
}
---
# Zalo connect and live UI

## Candidate observations
Inspect the Connect Zalo entry point, safe popup transition, pending/denied/failed feedback, active OA row, selected installation identity, live ordered transcript, delivery state, and responsive layout. Captures must omit OAuth state, authorization codes, tokens, and sensitive customer content.

The source opens only `https://oauth.zaloapp.com` in a new popup and renders an active Zalo binding, but actual callback feedback and post-popup refresh behavior are not proven.

## Done when
Current inspected images cover every approved connection and live-message state against the approved design resource.
