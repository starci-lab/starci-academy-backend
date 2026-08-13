# Strict gate optimized plan

This plan follows the business scan. It is a proposal for approval; it does not
apply gates or modify source by itself.

## Phase 1: canonical policy inventory

Create an operation matrix for GraphQL, REST, Socket.IO, webhooks, queues and
cron jobs. Do not start with ESLint. Record actor, scope, state invariants,
side effects, protection and negative-path tests.

## Phase 2: unconditional safety gates

Implement the rules that are transport- or language-safety invariants:

- typed exceptions and safe error envelopes
- DTO validation for untrusted input
- no direct secrets/process environment in business code
- no `any`, floating promises, swallowed failures or unsafe imports
- webhook signature before side effects
- explicit entity/table/data-access rules
- CQRS handler registration and orphan detection where CQRS exists

## Phase 3: policy-aware gates

Implement a policy declaration for each operation. Gates should verify that the
declared policy matches the implementation, but must not infer that every
operation requires end-user authentication.

Examples:

- `purchaseMembership`: user identity + membership/payment state + idempotency.
- `payosWebhook`: provider signature + replay protection + idempotency.
- `contact`: public policy + validation + throttling + abuse protection.
- `streakFreezeCron`: system policy + scheduler boundary + atomic state update.
- `profile`: identity + owner/scope predicate + visibility policy.

## Phase 4: semantic business review gates

For each write operation, review:

- actor and authorization
- owner/tenant/course/project scope
- allowed state transitions
- privilege escalation and self-action risks
- transaction and concurrency behavior
- idempotency and retry behavior
- required audit/event side effects

These findings should be tracked as review/test obligations, not forced into
fragile syntax-only lint rules.

## Phase 5: behavioral proof

Require negative-path tests selected from the policy matrix:

- anonymous caller where authentication applies
- wrong role or entitlement
- wrong owner/scope
- invalid state transition
- duplicate/replayed request
- concurrent request
- provider signature failure
- queue/event retry and duplicate delivery
- throttler behavior for abuse-sensitive operations

## Phase 6: rollout to other backends

StarCi becomes the canonical source for the plugin, gate runner, policy schema,
decision vocabulary and test contract. Mia and Nivo must consume these artifacts
and may only add a documented domain-specific policy, not a local semantic
rewrite. A backend is conformant only when its policy matrix, static gates and
behavioral tests agree.

## Approval required before implementation

Approve the following separately:

1. The business policy matrix format.
2. The unconditional safety gates.
3. The policy-aware operation classification.
4. The semantic review/test obligations.
5. The exceptions for public, webhook, system and infrastructure operations.
6. The order StarCi -> Mia -> Nivo.

Only after approval should the implementation phase add gate IDs, ESLint rules,
fixtures, CI scripts and migration commits.
