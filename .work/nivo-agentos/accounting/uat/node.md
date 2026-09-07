---
{
  "schema": "work/node@1",
  "id": "nivo.accounting.uat",
  "kind": "uat.ux",
  "required": true,
  "dependsOn": [
    "nivo.accounting.implementation",
    "nivo.login.uat.signin.ux"
  ],
  "refs": [
    "repo.nivo-backend",
    "repo.nivo-frontend",
    "env.tino-uat",
    "fixture.nivo-agentos-uat"
  ]
}
---
# Accounting UAT

## Boundary

Four flow groups cover setup/test/apply, document lifecycle, correction/reconciliation/reload, and two-install isolation. UI leaves require actual inspected images; UX leaves require driven behavior, readback, and negative checks. All runs must observe immutable served FE/BE identities in TINO rather than treating source HEAD as the served build.

## Shared prerequisites

The branch depends on accepted Accounting backend/frontend implementation and the shared signed-in UAT journey. Fixture aliases are references only; this tree neither provisions accounts nor stores credentials.

## Current posture

No fresh Accounting browser evidence is imported. Historical images and task notes remain navigation material, not pass evidence.
