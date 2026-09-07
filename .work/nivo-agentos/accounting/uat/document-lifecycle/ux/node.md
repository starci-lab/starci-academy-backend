---
{
  "schema": "work/node@1",
  "id": "nivo.accounting.uat.document-lifecycle.ux",
  "kind": "uat.ux",
  "required": true,
  "state": "suspended",
  "suspensionReason": "No fresh two-actor browser run proves submit, distinct approval, posting, period close, authorization refusal, and persisted readback in TINO.",
  "assertions": [
    "accounting-owner-submits-document",
    "accounting-distinct-approver-approves-document",
    "accounting-owner-posts-approved-document",
    "accounting-owner-closes-period",
    "accounting-document-lifecycle-persists-after-reload",
    "accounting-document-self-approval-is-refused"
  ]
}
---
# Document lifecycle UX

## Candidate acceptance

In separate browser contexts, drive owner submission, prove the owner cannot approve the submitted document, drive approval as the configured distinct approver, return to the owner to post, and close the period. Reload after transitions and verify the document, ledger version, signed amount, event history, and closed-period state are consistent with approved rules.

## Done when

Control-bound behavior evidence proves the ordered actor handoff, transactional refusals, post-command readback, reload persistence, and period-close consequence without using an API call as the action under test.
