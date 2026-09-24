# AG-007 — Khép luồng đăng ký → ví → mua AgentOS → cấp phát

Core identity, wallet, payment and AgentOS provisioning paths and suites exist; prove the complete customer outcome and failure compensation at one served delivery.

Read workflow.json beside this file as the user-request draft. First read <Source>/.claude/INDEX.md and follow its runtime. Source remains D:/Repositories/starci-academy-backend; routed repositories do not become Source.

Resolve prerequisites from their validated completion receipts, rebind source heads and check evidence freshness. Banking authorizes no execution, no approval and no external message. Never copy goalDraft into a confirmed mission or synthesize a user choice. Create a fresh session and derive the current chain with plan-chain.mjs, validate-chain.mjs and validate-request.mjs. If source is already delivered, verify/reconcile it instead of reimplementing it.

## Acceptance

- Signup/signin/OTP/reset returns the user to the intended AgentOS entry.
- Order payment, wallet debit and provisioning are idempotent under duplicate requests/webhooks.
- Pre-provision failure preserves or restores the money truth; post-payment failure is visible and retryable.
- One account with multiple instances retains separate plans, credit grants and ownership.
- Quota exhaustion/top-up/renewal have explicit user states and do not charge another workspace.

## Dependencies

AG-004

## Boundaries

AgentOS and its business flows only. Template App and Expert Academy are deferred. One execute unit per operator branch. Follow runtime profile, lease, stop and evidence contracts. Persist activation and final validated receipt references in workflow.json; keep session evidence alive or archive it durably before cleanup.
