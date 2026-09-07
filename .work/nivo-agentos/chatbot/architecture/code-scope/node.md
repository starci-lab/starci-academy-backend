---
{
  "schema": "work/node@1",
  "id": "nivo.chatbot.architecture.code-scope",
  "kind": "architecture",
  "required": true,
  "assertions": [
    "chatbot-backend-scope-mapped",
    "chatbot-frontend-scope-mapped",
    "chatbot-shared-boundaries-respected"
  ],
  "state": "done",
  "completion": {
    "inputDigest": "2692b947351b3c6bbea7fe0f3a1c6c2dd35a10a904d8c58c85bc317531ed5e65",
    "evidence": [
      "nivo.chatbot.architecture.code-scope.review-20260908"
    ]
  }
}
---
# Code scope and ownership

## Backend observed scope
- Catalog and Setup contract: `src/modules/bussiness/agentos-solution-modules/catalog/packages/multichannel-chatbot/` and `src/modules/bussiness/agentos-module-studio/catalog/multichannel-chatbot.ts`.
- Chatbot-owned primary model: `src/modules/bussiness/agentos-chatbot/` plus its primary entities and migrations.
- Instance runtime: `apps/agentos-controlplane/src/chatbot/`, Chatbot webhook controllers, instance entities/migrations, and Chatbot backup/restore runners.
- Owner gateway: `src/features/core/api/core/graphql/agentos-chatbot/`.

## Frontend observed scope
- Chatbot transport and caching: `apps/app/src/modules/api/workspace-controlplane.ts` and `apps/app/src/hooks/swr/**/workspace-controlplane.ts`.
- Installed-module routing and actions: `apps/app/src/components/pages/AgentOSSolutionModulePage/`.
- Operate UI: `apps/app/src/components/blocks/agentos/ChatbotWorkbenchBlock/`.
- Shared Setup/Test surfaces are consumed by the module page and remain owned by the shared-module work represented by `nivo.shared.implementation.backend` and `nivo.shared.implementation.frontend`.

## Candidate ownership rule
Chatbot owns module-specific manifest semantics, projection adapter, provider/channel/conversation behavior, Chatbot gateway contract, and its operate workbench. Shared Setup/Test engines, shells, Grammar primitives, authentication, environment, and provider secret custody stay with their canonical owners.

## Done when
The implementation write ceiling, shared contracts, migration/mapping responsibility, and cross-repository integration checks are approved without copying shared ownership into Chatbot.
