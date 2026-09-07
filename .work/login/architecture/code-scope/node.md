---
{
  "schema": "work/node@1",
  "id": "nivo.login.architecture.code-scope",
  "kind": "architecture",
  "required": true,
  "dependsOn": ["nivo.login.business.acceptance"],
  "refs": ["repo.nivo-backend", "repo.nivo-frontend", "design.login-form"],
  "assertions": ["login-code-scope-reviewed"],
  "state": "suspended",
  "suspensionReason": "The source and design paths are inventoried, but final implementation and visual write boundaries are not approved."
}
---
# Code scope

## Frontend boundary
`apps/app/src/components/pages/AuthenticationPage`, `components/blocks/auth/AuthenticationPanel`, the authentication route, auth API/hook modules, `modules/auth/session.tsx`, console auth redirect and bounded tests/locales.

## Backend boundary
The `sign-in`, `refresh-session`, cookie and token verification/sync paths plus bounded unit/e2e tests.

## Design input
`design.login-form` is a source record for review, not approved art direction. Sign-up and forgot-password surface work is excluded.
