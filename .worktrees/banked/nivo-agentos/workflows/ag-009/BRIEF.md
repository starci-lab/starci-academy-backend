# AG-009 — Hoàn thiện Chatbot: tiếp nhận → trả lời → bàn giao → đóng hội thoại

Complete the chosen Chatbot identity and its actual conversation lifecycle. The inspected generic customer-support adapter only records decisions; trace dedicated runtime services to distinguish real sends/task changes from recorded-only outcomes.

Read workflow.json beside this file as the user-request draft. First read <Source>/.claude/INDEX.md and follow its runtime. Source remains D:/Repositories/starci-academy-backend; routed repositories do not become Source.

Resolve prerequisites from their validated completion receipts, rebind source heads and check evidence freshness. Banking authorizes no execution, no approval and no external message. Never copy goalDraft into a confirmed mission or synthesize a user choice. Create a fresh session and derive the current chain with plan-chain.mjs, validate-chain.mjs and validate-request.mjs. If source is already delivered, verify/reconcile it instead of reimplementing it.

## Acceptance

- Inbound event creates one owned conversation/task; duplicate events produce no duplicate task.
- Reply uses the applied immutable context and SLA/privacy/escalation policy.
- A required human handoff preserves the customer words, owner and reason.
- Claim/approve/reply/resolve update real task versions and reject stale or foreign actions.
- For an explicitly authorized outbound test, prove the send acknowledgement; otherwise label draft/recorded-only.

## Dependencies

AG-006, AG-008

## Boundaries

AgentOS and its business flows only. Template App and Expert Academy are deferred. One execute unit per operator branch. Follow runtime profile, lease, stop and evidence contracts. Persist activation and final validated receipt references in workflow.json; keep session evidence alive or archive it durably before cleanup.
