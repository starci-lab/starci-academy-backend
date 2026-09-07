---
{
  "schema": "work/node@1",
  "id": "nivo.shared.lifecycle",
  "kind": "business",
  "required": true,
  "refs": ["repo.nivo-backend", "repo.nivo-frontend"]
}
---
# Shared AgentOS module lifecycle

## Pilot boundary
Candidate shared lifecycle used by solution modules, limited to install, setup, test, apply or rollback, recovery, retirement of legacy catalog/helpdesk entry points, and isolation between installations. Chatbot- and Accounting-specific behavior is excluded.

## Observed source mapping
- Backend observation at `repo.nivo-backend` commit `51248f75e0bf1c36a088afb57a04b2d7440a62c4`: installation identity/status and generation fields live in `agentos-module-installation.entity.ts`; install dispatch is idempotency-keyed; Studio services contain setup, test, apply, rollback, event projection and retry mechanisms.
- Frontend observation at `repo.nivo-frontend` commit `f234d1abe6dd8f59fa4031959f8c55934e8997b0`: `AgentOSSolutionModulePage` exposes installation-scoped Setup, Test, Operate, Settings and Diagnostics routes; `AgentOSSolutionModuleCenter` still exposes catalogue and installed views.

## Approved intent
The current request authorizes importing this candidate Work tree only. It does not approve the inferred business behavior, visual direction, implementation completeness, retirement, or UAT.

## Unknowns
The canonical retirement meaning for catalogue/helpdesk, production recovery policy, measurable latency targets and final visual direction require owner review.
