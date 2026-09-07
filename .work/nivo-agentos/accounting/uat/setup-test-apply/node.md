---
{
  "schema": "work/node@1",
  "id": "nivo.accounting.uat.setup-test-apply",
  "kind": "uat.ux",
  "required": true,
  "refs": [
    "identity.tino-owner"
  ]
}
---
# Setup, exact test, and apply flow

Use the owner identity and an Accounting installation from the fixture. The candidate journey must keep the same setup session/draft digest and lifecycle generations through required gate review, the exact `payables-review` acceptance test, apply, and active-context readback. Its UI and UX are proven separately by child leaves.
