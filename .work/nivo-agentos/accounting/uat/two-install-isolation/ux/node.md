---
{
  "schema": "work/node@1",
  "id": "nivo.accounting.uat.two-install-isolation.ux",
  "kind": "uat.ux",
  "required": true,
  "state": "suspended",
  "suspensionReason": "No fresh TINO browser run with two fixture installations proves route, cache, authorization, mutation, and reload isolation end to end.",
  "assertions": [
    "accounting-installation-a-mutation-does-not-change-b",
    "accounting-cross-install-resource-action-is-refused",
    "accounting-installation-cache-and-reload-remain-isolated",
    "accounting-installation-read-models-remain-disjoint"
  ]
}
---
# Two-install isolation UX

## Candidate acceptance

Open installations A and B in isolated browser contexts or otherwise verified disjoint sessions, record both baselines, drive a permitted mutation only in A, and reload both. Attempt a cross-install resource action through the rendered surface where safely expressible and verify refusal without disclosure. Confirm the B cache/read model and every persisted record remain unchanged.

## Behavior gap

The inspected PostgreSQL container spec exercises one installation and the service SQL consistently qualifies rows by installation, but no explicit two-install browser scenario was found. This UAT leaf closes that gap rather than promoting implementation scoping into end-to-end proof.

## Done when

Control-bound evidence and readback prove mutation isolation, non-enumerating refusal, cache separation, and persisted disjointness for both installations on the actual TINO build.
