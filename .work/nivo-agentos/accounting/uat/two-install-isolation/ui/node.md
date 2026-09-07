---
{
  "schema": "work/node@1",
  "id": "nivo.accounting.uat.two-install-isolation.ui",
  "kind": "uat.ui",
  "required": true,
  "state": "suspended",
  "suspensionReason": "Accounting art direction is unapproved and no fresh paired TINO screenshots prove that two installation routes render disjoint identities and records.",
  "refs": [
    "design.accounting-workbench"
  ],
  "assertions": [
    "accounting-installation-identities-ui-distinct",
    "accounting-installation-records-ui-disjoint",
    "accounting-installation-navigation-ui-clear"
  ]
}
---
# Two-install isolation UI

## Observed source

Frontend queries and mutations include installation ID in cache and operation identity, while the route passes `installationId` into the module page and workbench. A preserved historical second-installation image exists elsewhere as import material, but it is not fresh UAT proof or approved direction.

## Candidate acceptance

Capture installations A and B after a mutation in A. Each view must clearly identify its current installation context and show only its own document, ledger, correction, reconciliation, period, and event rows under approved visual criteria.

## Done when

Paired inspected screenshots from the same served-version observation demonstrate clear installation context and disjoint visible records without relying on historical capture claims.
