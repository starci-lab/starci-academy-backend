---
{
  "schema": "work/node@1",
  "id": "nivo.shared.implementation.frontend",
  "kind": "implementation",
  "required": true,
  "dependsOn": ["nivo.shared.architecture.data-ownership", "nivo.shared.architecture.api-events", "nivo.shared.architecture.code-scope"],
  "refs": ["design.agentos-shared-ui", "repo.nivo-frontend"],
  "assertions": ["shared-frontend-implemented", "shared-frontend-tests-pass"],
  "state": "suspended",
  "suspensionReason": "Frontend lifecycle screens are observed at the inspected HEAD, but shared art direction, rendered acceptance and current completion evidence are not approved."
}
---
# Frontend implementation

## Observed source
`AgentOSSolutionModulePage` renders installation-scoped Setup, Test, Operate, Settings and Diagnostics screens with pending/refused states; setup test identity is checked against draft/context digests and generations. `AgentOSSolutionModuleCenter` still renders catalogue/installed views.

## Candidate work
Implement only the approved shared flow and visual direction, with clear progress, refusal, retry and stale-result states. Do not treat existing screenshots or component tests as visual approval.

## Done when
Current tests and rendered review cover the approved surfaces at an exact commit.
