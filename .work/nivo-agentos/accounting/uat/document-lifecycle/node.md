---
{
  "schema": "work/node@1",
  "id": "nivo.accounting.uat.document-lifecycle",
  "kind": "uat.ux",
  "required": true,
  "refs": [
    "identity.tino-owner",
    "identity.tino-approver"
  ]
}
---
# Document submit, distinct approval, post, and period close

Use isolated owner and approver browser contexts and a document in an approved open-period fixture. The candidate flow is owner submit → distinct approver approval → owner post → owner period close, with state/readback and negative authorization checks at each boundary.
