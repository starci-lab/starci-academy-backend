---
{
  "schema": "work/node@1",
  "id": "nivo.accounting.architecture.code-scope",
  "kind": "architecture",
  "required": true,
  "state": "done",
  "refs": [
    "repo.nivo-backend",
    "repo.nivo-frontend"
  ],
  "assertions": [
    "accounting-backend-code-boundary-approved",
    "accounting-frontend-code-boundary-approved",
    "accounting-shared-seams-approved"
  ],
  "completion": {
    "inputDigest": "db8db3b86e599a17a2bff950811c83bbbb56baef962d7a2c07f1502286a2bf8a",
    "evidence": [
      "nivo.accounting.architecture.code-scope.review-20260908"
    ]
  }
}
---
# Code ownership scope

## Observed source

- Backend candidate owner: `src/modules/bussiness/agentos-accounting/**`, plus the Accounting GraphQL boundary under `src/features/core/api/core/graphql/agentos-accounting/**` and Accounting database migrations.
- Frontend candidate owner: `apps/app/src/components/blocks/agentos/AccountingWorkbenchBlock/**`, `apps/app/src/modules/api/accounting.ts`, and Accounting SWR query/mutation hooks.
- Shared seams observed outside this branch include AgentOS module setup/test/apply lifecycle, installation routing, authenticated GraphQL infrastructure, workbench registry, localization, and common UI grammar.

## Candidate decision

Freeze which files are Accounting-owned versus Shared-owned, how schema/API changes cross the boundary, and which tests gate each repository. The visual-direction image at `docs/visual-direction/accounting-workbench.png` is an observed artifact, not approved design authority.

## Done when

Code owners approve the backend/frontend ceilings, Shared integration seams, change protocol, and verification commands without copying shared ownership into Accounting.
