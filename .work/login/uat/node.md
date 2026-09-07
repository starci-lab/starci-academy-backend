---
{
  "schema": "work/node@1",
  "id": "nivo.login.uat",
  "kind": "uat",
  "required": true,
  "refs": ["repo.nivo-backend", "repo.nivo-frontend", "env.tino-uat", "identity.tino-owner", "fixture.nivo-agentos-uat", "design.login-form"]
}
---
# Sign-in UAT candidate

UAT must drive the actual rendered form on TINO using the existing sealed owner identity and record actual served FE/BE artifact identities. No account creation, secret capture or fabricated success is authorized.
