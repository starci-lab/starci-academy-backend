---
{
  "schema": "work/node@1",
  "id": "nivo.chatbot.architecture",
  "kind": "architecture",
  "required": true,
  "dependsOn": [
    "nivo.chatbot.business.acceptance"
  ],
  "refs": [
    "repo.nivo-backend",
    "repo.nivo-frontend"
  ]
}
---
# Chatbot architecture

## Purpose
Review the source-observed ownership, contracts, events, and code boundaries against the approved business model before implementation or UAT receives credit.

## Done when
The data owner, API/event protocol, and repository scope are explicit, consistent, and reviewed with unresolved distributed-system or provider semantics retained.
