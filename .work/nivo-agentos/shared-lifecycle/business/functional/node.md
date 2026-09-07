---
{
  "schema": "work/node@1",
  "id": "nivo.shared.business.functional",
  "kind": "business",
  "required": true,
  "refs": [
    "repo.nivo-backend",
    "repo.nivo-frontend"
  ],
  "assertions": [
    "shared-functional-reviewed"
  ],
  "state": "done",
  "completion": {
    "inputDigest": "1398816562cd27e6466756308a2918b2922c24fc96f75220ce9db25ef7b1ad5b",
    "evidence": [
      "nivo.shared.business.functional.review-20260908"
    ]
  }
}
---
# Functional behavior

## Candidate scope
An owner can install a named module into one workspace, inspect its installation state, progress setup revisions, bind an exact test result, apply an eligible context or roll back to an eligible prior context, and recover or retry without creating a second logical request.

## Observed source
`InstallAgentosSolutionModuleHandler` and `AgentosModuleInstallationService` implement install dispatch and idempotency; `AgentosModuleStudioService` and `AgentOSSolutionModulePage` expose setup, test, apply and rollback concepts at the inspected commits.

## Done when
The owner confirms the actors, supported transitions, exclusions and recovery outcomes without treating observed code as approval.
