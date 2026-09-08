---
{
  "schema": "work/node@1",
  "id": "nivo.accounting.uat.correction-reconciliation-reload",
  "kind": "uat.ux",
  "required": true,
  "refs": [
    "identity.tino-owner",
    "identity.tino-approver"
  ]
}
---
# Correction, distinct approval, reconciliation, and reload

Use a posted source entry, a later open period, and isolated owner/approver contexts. The candidate flow is owner correction proposal → distinct approver approval → owner reconciliation → reload/current-and-as-of readback.
