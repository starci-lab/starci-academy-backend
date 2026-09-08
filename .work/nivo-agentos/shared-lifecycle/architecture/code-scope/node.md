---
{
  "schema": "work/node@1",
  "id": "nivo.shared.architecture.code-scope",
  "kind": "architecture",
  "required": true,
  "dependsOn": [
    "nivo.shared.business.acceptance"
  ],
  "refs": [
    "repo.nivo-backend",
    "repo.nivo-frontend"
  ],
  "assertions": [
    "shared-code-scope-reviewed"
  ],
  "state": "done",
  "completion": {
    "inputDigest": "8197346388922d528fe23e69752465d91d8716b63e7b1fb6ea7844403ea9a6e5",
    "evidence": [
      "nivo.shared.architecture.code-scope.review-20260908"
    ]
  }
}
---
# Code scope

## Backend boundary
Candidate owners are `src/modules/bussiness/agentos-solution-modules`, `src/modules/bussiness/agentos-module-studio`, the AgentOS workspace GraphQL queries/mutations, their database entities/migrations and bounded tests.

## Frontend boundary
Candidate owners are `apps/app/src/components/pages/AgentOSSolutionModulePage`, shared AgentOS blocks, installation routes, query/mutation hooks and workspace-controlplane API adapters.

## Exclusions
Chatbot/Accounting workbench behavior, deployment, identity provisioning and unrelated catalogue commerce are outside this branch.
