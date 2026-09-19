# AG-006 — Chứng minh cổng Setup → Test → Apply → Live không bị đi vòng

applySetup requires a completed setup plus matching Test evidence; applyContextVersion directly activates a context. Determine the intended rollback/activation policy and prove both paths enforce it. Live currently checks a Telegram credential.

Read workflow.json beside this file as the user-request draft. First read <Source>/.claude/INDEX.md and follow its runtime. Source remains D:/Repositories/starci-academy-backend; routed repositories do not become Source.

Resolve prerequisites from their validated completion receipts, rebind source heads and check evidence freshness. Banking authorizes no execution, no approval and no external message. Never copy goalDraft into a confirmed mission or synthesize a user choice. Create a fresh session and derive the current chain with plan-chain.mjs, validate-chain.mjs and validate-request.mjs. If source is already delivered, verify/reconcile it instead of reimplementing it.

## Acceptance

- An incomplete setup cannot become live.
- A failed, stale, foreign or wrong-context Test cannot authorize an activation unless an explicitly confirmed rollback policy permits that exact path.
- Test operates in its declared sandbox and never fabricates a customer conversation or provider success.
- Apply enqueues a desired-state version; live access waits for its actual acknowledgement.
- Readiness is correct for the two selected modules: an Accounting module without a chat-channel requirement must not be blocked by a universal Telegram credential gate.

## Dependencies

AG-001, AG-002, AG-004

## Boundaries

AgentOS and its business flows only. Template App and Expert Academy are deferred. One execute unit per operator branch. Follow runtime profile, lease, stop and evidence contracts. Persist activation and final validated receipt references in workflow.json; keep session evidence alive or archive it durably before cleanup.
