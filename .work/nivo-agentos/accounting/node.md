---
{
  "schema": "work/node@1",
  "id": "nivo.accounting",
  "kind": "business",
  "required": true
}
---
# Nivo Accounting

## Pilot boundary

This candidate subtree covers the Accounting installation and workbench for AgentOS: reviewed business scope, architecture, backend/frontend implementation, and bounded TINO UAT journeys. Login and Shared module lifecycle remain owned by their existing workspace nodes.

## Observed source mapping

- Backend observation at `51248f75e0bf1c36a088afb57a04b2d7440a62c4`: `src/modules/bussiness/agentos-accounting/` contains the setup contract, transactional service, persistence migration, provider, and tests; `src/features/core/api/core/graphql/agentos-accounting/` contains authenticated GraphQL boundaries.
- Frontend observation at `f234d1abe6dd8f59fa4031959f8c55934e8997b0`: `apps/app/src/components/blocks/agentos/AccountingWorkbenchBlock/` contains the connected workbench and component/controller tests; `apps/app/src/modules/api/accounting.ts` owns the client contract.
- These are source observations only. They do not approve business intent, establish a served build, or prove browser UAT.

## Candidate intent

The candidate is to make Accounting setup and day-to-day evidence, approval, posting, period, reconciliation, and correction work explicit and testable per installation. Product-owner review must confirm the intended policy and exclusions before this subtree can be accepted.

## Unknowns

- Final business policy, thresholds, evidence labels, prohibited actions, and operational ownership are not approved by migration.
- The Accounting workbench art direction is not approved.
- No TINO browser run, immutable served-version identity, or multi-installation fixture proof is imported here.
