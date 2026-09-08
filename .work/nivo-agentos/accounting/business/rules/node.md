---
{
  "schema": "work/node@1",
  "id": "nivo.accounting.business.rules",
  "kind": "business",
  "required": true,
  "state": "done",
  "refs": [
    "repo.nivo-backend"
  ],
  "assertions": [
    "accounting-role-rules-approved",
    "accounting-ledger-and-period-rules-approved",
    "accounting-setup-and-evidence-rules-approved"
  ],
  "completion": {
    "inputDigest": "68f165d51d53db031bff4054e1f1e6aa0fa35346e9f0fa3f0289263bb0865e9c",
    "evidence": [
      "nivo.accounting.business.rules.review-20260908"
    ]
  }
}
---
# Accounting rules

## Observed source

- `accounting.setup-definition.ts` currently accepts only `income`, `expense`, `receivable`, and `payable`; requires an uppercase three-letter non-`XXX`/non-`XTS` functional currency; and requires `distinctApprover: true`.
- `accounting.service.ts` currently restricts owner versus approver commands, rejects submitter self-approval, posts expense/payable as negative and income/receivable as positive, prevents posting or correction into a closed period, requires a correction in a later open month, and appends an approved correction at the next ledger version.
- The service scopes reads, writes, idempotency, and event records by installation and refuses authorization when the stored owner drifts from the catalog owner.

## Candidate intent

Review each observed rule for business correctness, including whether the classification set, currency policy, actor separation, sign convention, correction lineage, period handling, evidence requirements, and setup ownership are complete. Do not interpret implementation constraints as approved policy without that review.

## Done when

The accountable owner has approved or corrected every rule, named the source of authority, and resolved conflicts between business policy and observed implementation.
