# AG-001 — Khóa phạm vi hai module Chatbot và Kế toán

The release contains exactly two product modules: Chatbot and Accounting. Inspect the existing support-desk/customer-support, legacy multichannel-chatbot and finance-copilot/accounting definitions; select one durable identity for each rather than creating duplicate modules.

Read workflow.json beside this file as the user-request draft. First read <Source>/.claude/INDEX.md and follow its runtime. Source remains D:/Repositories/starci-academy-backend; routed repositories do not become Source.

Resolve prerequisites from their validated completion receipts, rebind source heads and check evidence freshness. Banking authorizes no execution, no approval and no external message. Never copy goalDraft into a confirmed mission or synthesize a user choice. Create a fresh session and derive the current chain with plan-chain.mjs, validate-chain.mjs and validate-request.mjs. If source is already delivered, verify/reconcile it instead of reimplementing it.

## Acceptance

- Freeze exactly two user-visible module contracts, Chatbot and Accounting; no third module is introduced.
- Choose the Chatbot identity from the existing support-desk and legacy multichannel-chatbot definitions, with a documented compatibility/migration rule.
- Bind Accounting to existing finance-copilot/accounting where compatible; distinguish its generic approval widget from a usable bookkeeping flow.
- For each module freeze actor, setup fields, supported inputs/actions, outcomes, failures, owner handoff and launch criteria.
- Suggested Accounting MVP: capture evidence, classify inflow/expense, human approval, durable posting, reconciliation and reporting; provider payments/tax filing stay outside the current contract unless separately decided.
- Supporting knowledge/retrieval is inside these two modules, never a standalone Knowledge Hub requirement.
- Define the second brain ownership, knowledge sources, review/update lifecycle and permitted sharing for each of the two modules.

## Dependencies

None in the bank; current preflight and required decision/input gates still apply.

## Boundaries

AgentOS and its business flows only. Template App and Expert Academy are deferred. One execute unit per operator branch. Follow runtime profile, lease, stop and evidence contracts. Persist activation and final validated receipt references in workflow.json; keep session evidence alive or archive it durably before cleanup.
