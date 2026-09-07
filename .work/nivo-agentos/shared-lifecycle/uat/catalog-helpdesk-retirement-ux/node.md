---
{
  "schema": "work/node@1",
  "id": "nivo.shared.uat.catalog-helpdesk-retirement.ux",
  "kind": "uat.ux",
  "required": true,
  "dependsOn": ["nivo.shared.implementation.backend", "nivo.shared.implementation.frontend"],
  "refs": ["repo.nivo-backend", "repo.nivo-frontend", "env.tino-uat", "identity.tino-owner", "fixture.nivo-agentos-uat"],
  "assertions": ["shared-catalog-helpdesk-retirement-behavior"],
  "state": "suspended",
  "suspensionReason": "The owner has not specified which catalogue/helpdesk routes, labels and compatibility redirects retire, so a behavioral journey cannot be accepted."
}
---
# Catalogue/helpdesk retirement — UX

Drive every owner-approved legacy entry point and confirm it is absent, safely redirected, or explains the replacement without data loss. Confirm installed modules remain reachable and that retirement does not silently start installation or cross into Chatbot-specific behavior.
