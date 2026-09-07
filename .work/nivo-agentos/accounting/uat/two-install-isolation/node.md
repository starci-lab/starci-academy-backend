---
{
  "schema": "work/node@1",
  "id": "nivo.accounting.uat.two-install-isolation",
  "kind": "uat.ux",
  "required": true,
  "refs": [
    "identity.tino-owner"
  ]
}
---
# Two-installation isolation

Use two Accounting installations with disjoint fixture records. A mutation and subsequent readback in installation A must not alter, expose, or authorize any Accounting state in installation B; cache/navigation identity and server authorization both belong to this boundary.
