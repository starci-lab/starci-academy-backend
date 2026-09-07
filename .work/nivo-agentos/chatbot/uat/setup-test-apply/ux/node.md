---
{
  "schema": "work/node@1",
  "id": "nivo.chatbot.uat.setup-test-apply.ux",
  "kind": "uat.ux",
  "required": true,
  "assertions": [
    "chatbot-setup-test-apply-behavior",
    "chatbot-setup-rejects-unverified-context",
    "chatbot-applied-context-persists-after-reload"
  ],
  "state": "suspended",
  "suspensionReason": "No current browser-driven TINO run proves the exact Setup, Test, Apply, negative gates, and reload/readback behavior."
}
---
# Setup, Test, and Apply UX

## Candidate behavior
- Drive owner input through the rendered Setup controls; confirm the exact candidate digest and required areas.
- Run the required acceptance scenarios against that exact context and observe their terminal results.
- Verify Apply is refused for incomplete, failed, or stale inputs and succeeds only for the exact passing target.
- Reload the installation and verify the same approved version/context is read back; do not infer live delivery solely from Apply.

## Done when
A current behavior evidence bundle records every driven control, result, negative gate, and post-reload readback with actual served-version provenance.
