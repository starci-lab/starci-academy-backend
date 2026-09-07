---
{
  "schema": "work/node@1",
  "id": "nivo.chatbot.uat",
  "kind": "uat.ux",
  "required": true,
  "dependsOn": [
    "nivo.chatbot.implementation.backend",
    "nivo.chatbot.implementation.frontend",
    "nivo.login.uat.signin.ux"
  ],
  "refs": [
    "repo.nivo-backend",
    "repo.nivo-frontend",
    "env.tino-uat",
    "identity.tino-owner",
    "fixture.nivo-agentos-uat"
  ]
}
---
# Chatbot UAT

## Boundary
Browser/provider acceptance is grouped by complete owner journeys. Every leaf must bind the actual TINO environment, owner identity, isolated fixture namespace, and served immutable frontend/backend versions; repository HEADs alone are not runtime provenance.

## Safety
Credentials remain in their approved custody. Captures must be reviewed and redacted before storage. Live provider mutations use only the declared fixture namespace and never infer transfer, account creation, or secret rotation authority.

## Done when
All four required flow groups have separate, current UI and UX evidence for their declared assertions, including negative and reload/readback states.
