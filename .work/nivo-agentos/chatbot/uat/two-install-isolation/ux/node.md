---
{
  "schema": "work/node@1",
  "id": "nivo.chatbot.uat.two-install-isolation.ux",
  "kind": "uat.ux",
  "required": true,
  "assertions": [
    "chatbot-two-install-read-isolation",
    "chatbot-two-install-command-isolation",
    "chatbot-provider-account-transfer-refused",
    "chatbot-two-install-state-unchanged-after-negative-tests"
  ],
  "state": "suspended",
  "suspensionReason": "Source contains ownership and transfer-refusal checks, but no current two-context TINO UAT proves cross-install read/command isolation and unchanged state."
}
---
# Two-install isolation UX

## Candidate behavior
- Read installation A and B through their valid contexts and verify disjoint installation IDs, channels, conversations, messages, and approved versions.
- Attempt workbench reads and handoff/retry/reconciliation commands with a foreign installation/workspace pairing; verify refusal before controlplane mutation and no foreign payload disclosure.
- Attempt to bind one provider account already owned by the other installation; verify an explicit-transfer requirement rather than silent takeover.
- Reload both installations after negative attempts and verify their prior state and ordered histories remain unchanged.

## Done when
A two-context, two-namespace run proves read and mutation isolation plus stable post-failure readback with current served-version evidence.
