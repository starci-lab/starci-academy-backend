# Banked missions

Prepared work that has not been activated. Product-specific banks live at `<product>/`; the current bank is [Nivo AgentOS](nivo-agentos/REPORT.vi.md), limited to **Chatbot and Accounting**.

`banked` names the stable home. Readiness belongs in each card's `status`, so a change from blocked to ready never changes a reference path. These folders are local planning artifacts, not Git worktrees and not running sessions.

## Read the bank

From the Source repository:

```powershell
node .worktrees/banked/bank.mjs list
node .worktrees/banked/bank.mjs validate
node .worktrees/banked/bank.mjs brief AG-001
node .worktrees/banked/bank.mjs freshness
```

The CLI only reads. It creates no task, agent, session, branch, approval, lease or runtime effect.

## One lifecycle

| Status | Meaning |
| --- | --- |
| draft | Scope or required planning inputs are incomplete. |
| ready | A sufficiently bounded brief can be picked up for planning. This is **not** operational readiness or execution authorization. |
| blocked | A named prerequisite or owner decision has no accepted evidence yet. |
| running | An actual session has been linked in `activation`; the session owns execution and leases. |
| done | Accepted completion receipts prove every acceptance condition; activation records their durable paths. |
| cancelled | The owner explicitly withdrew the item; keep its id and history. |

Update the existing card; do not move it between status folders or create a parallel queue. `index.json` lists locations only, while `workflow.json` is the single home of status and dependencies. Unknown or retired IDs are never reused. The unused AG-010, AG-016 and AG-017 were retired while narrowing the draft; they were never run.

## Activate through StarCi

1. Read `<Source>/.claude/INDEX.md` and its load order. Source is the bootstrap host, never a routed checkout. Read the selected card and its fingerprinted evidence as the proposed user request.
2. Inspect prerequisites' completion receipts, current source heads, relevant active sessions and current runtime capabilities. Reuse completed work; stale source or historical blockers require a fresh observation.
3. Follow the current goal, authorization and session gates. `goalDraft` is a draft: it carries no recorded choice. Banking a task never fabricates an owner approval or authorizes later outbound messages.
4. Create the real session under `@worktrees/sessions`, import valid historical producers with `producer-import.mjs`, derive its chain with `plan-chain.mjs`, and validate the chain and each request. Expand plans into one unit per execute branch. All required source, quality, API, audit, UAT, business-reconciliation and publication gates remain the runtime's responsibility.
5. Record the actual session id in `activation`. The runtime remains the only scheduler and lease authority. Never run concurrent writers of the same checkout alias. Owner-library work uses its declared route and publish/consume contract.
6. Only mark done after the current operator and session gates accept the relevant receipts and the card's acceptance is fully proved. Archive receipt bytes durably before session cleanup; a link to deleted evidence is not completion. Unblock dependants only from those receipts.

The bank does not add `.claude/workflows/*.json`, an executable chain, a new operator, an alias or a second routing policy. It provides the mission inputs that the current runtime uses to derive a chain at activation. Ordinary project-local planning files are read as the user's request, not granted as arbitrary operator contexts.

## Persistence

This bank is under the host's machine-local `.worktrees` tree. Delivery here is local; it has not been committed, pushed or installed as a `.claude` runtime feature. Keep the bank and its evidence together when backing up or transferring the host. The source receipts and business heads retain their original authorities.
