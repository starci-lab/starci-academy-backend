---
{
  "schema": "work/node@1",
  "id": "nivo.chatbot.uat.telegram-conversation.ui",
  "kind": "uat.ui",
  "required": true,
  "refs": [
    "design.chatbot-workbench"
  ],
  "assertions": [
    "chatbot-telegram-transcript-ui-observed",
    "chatbot-telegram-handoff-retry-ui-states-observed",
    "chatbot-telegram-ui-design-reviewed"
  ],
  "state": "suspended",
  "suspensionReason": "Chatbot workbench direction is unapproved; no current TINO images prove Telegram transcript, handoff, failure, retry, or reload states."
}
---
# Telegram workbench UI

## Candidate observations
Capture the active Telegram binding, selected installation identity, ordered inbound/outbound transcript, delivery labels, human/automated handoff state, failed/ambiguous distinction, retry feedback, and post-reload state at approved viewports.

The inspected workbench renders transcript, handoff, and ambiguity controls, but no failed-reply retry control was found in the frontend source.

## Done when
Inspected current images cover the approved states and design at each required viewport without exposing the bot credential or sensitive message data.
