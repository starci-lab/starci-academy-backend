---
{
  "schema": "work/node@1",
  "id": "nivo.shared.uat",
  "kind": "uat",
  "required": true,
  "refs": ["repo.nivo-backend", "repo.nivo-frontend", "env.tino-uat", "identity.tino-owner", "fixture.nivo-agentos-uat"]
}
---
# Shared lifecycle UAT candidate

Browser UAT must use the actual TINO environment, owner identity, isolated fixture namespace and observed served build identities. Source HEAD and historical screenshots are not served-build proof.
