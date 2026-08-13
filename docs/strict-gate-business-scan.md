# Strict gate business scan

Status: analysis only. No lint, gate, or production source was changed by this scan.

## Decision principle

The strict contract is that every operation has a named business policy and that
the policy is enforced at the correct layer. The contract is not that every
mutation must use the same authentication guard, every capability must use CQRS,
or every endpoint must use the same throttler.

## Observed business surfaces

The repository contains a GraphQL API, REST/webhook edges, Socket.IO features,
scheduled business jobs, CQRS handlers, payment integrations, AI operations,
learning progress, rewards, memberships, personal projects, community and
contact flows. The core app registers `CqrsModule.forRoot()`, a global
`ValidationPipe`, an exception filter, and a global throttler. E2E tests also
exercise CQRS discovery through real `CommandBus`/`QueryBus` instances.

## Operation examples and proposed decisions

| Operation family | Business policy found/expected | Decision | Required proof |
| --- | --- | --- | --- |
| Purchase membership / payment mutation | Authenticated learner, payment state, idempotency, transaction | KEEP | Wrong user, duplicate payment, invalid state, concurrent request |
| Profile/progress/personal project mutation | Authenticated owner, resource predicate, domain state | KEEP | Wrong owner and wrong scope must return the same safe failure |
| Challenge/CV/coding submission | Authenticated learner, enrollment/entitlement, submission state, queue side effects | KEEP | Guard, handler invariant, duplicate submission and job failure tests |
| Reward claiming / streak freeze | Authenticated learner, current streak/quota/state, atomic grant | KEEP | Double claim, expired state and concurrent claim tests |
| Contact/public outreach | Public by product intent; untrusted payload | CONDITIONAL | DTO, rate limit, abuse control and public-operation documentation |
| Payment provider webhook | Provider-authenticated, not end-user-authenticated | CONDITIONAL | Signature, replay protection, idempotency and safe retry tests |
| Cron grants, cleanup and enforcement | Trusted scheduler/system actor | CONDITIONAL | Scheduler boundary, overlap protection, idempotency and audit/error policy |
| Public profile or landing read | May be anonymous; visibility is the business policy | CONDITIONAL | Visibility matrix and private-profile negative tests |
| Health/readiness | Infrastructure caller | DOCUMENT | Separate liveness/readiness policy; no user auth requirement |
| Simple read-only lookup | Depends on sensitivity and scope | CONDITIONAL | Public/private classification and ownership query review |

## Gate decisions

### Keep broadly

- DTO validation at every untrusted transport boundary.
- Typed exception and safe error translation at every transport boundary.
- Ownership/tenant predicates in the database query.
- Webhook authenticity before side effects.
- Idempotency for payment, webhook, reward, queue and event operations.
- EntityManager/data-access and explicit transaction rules.
- No direct secret or environment access in business code.
- CQRS registration/orphan/duplicate-handler checks where CQRS is used.
- No floating promises, swallowed catches and unbounded retries.
- Explicit entity table names, deep imports and documented exports.

### Conditional on business policy

- Authentication guard on a mutation.
- Domain authorization guard.
- Throttler tier and key strategy.
- CQRS adoption.
- Transaction/lock requirement.
- Audit event requirement.
- Cache policy.
- Public endpoint exception.

### Do not enforce as a blanket rule

- Every mutation must require end-user authentication.
- Every CRUD operation must be converted to CQRS.
- Every endpoint must use the strictest throttler.
- Every cross-field rule must be a DTO decorator.
- Every guard must contain the full business invariant.
- Every public operation must be rejected because it lacks a user guard.

## Enforcement classification

| Concern | Static lint | AST/gate | Business review | Runtime test |
| --- | --- | --- | --- | --- |
| `new Error`, `any`, barrel import, direct env | Yes | Optional | No | No |
| Handler interface and module registration | Partial | Yes | No | Yes |
| Mutation policy declaration | No | Yes | Yes | Yes |
| Correct owner/tenant scope | No | Partial | Yes | Yes |
| State transition | No | No | Yes | Yes |
| Webhook signature/idempotency | No | Partial | Yes | Yes |
| Throttler presence | Partial | Yes | Yes | Yes |
| Correct throttler key/limit | No | No | Yes | Yes |
| Transaction/locking correctness | No | Partial | Yes | Yes |
| Event retry/dead-letter behavior | No | Partial | Yes | Yes |

## Required business policy record

Before a future gate is implemented, each operation should be classifiable as:

- authenticated-user
- public
- internal-service
- signed-webhook
- system-job
- admin/operator
- owner-scoped
- tenant/course/project-scoped

The record must name actor, resource scope, allowed state, side effects,
protection and negative-path tests. An operation with no policy is a finding;
an operation with a non-user policy is not automatically a vulnerability.

## Main false-positive risks

- Treating `@UseGuards` as proof that ownership is enforced.
- Adding authentication to provider webhooks and scheduler jobs.
- Requiring CQRS for simple reads and infrastructure endpoints.
- Requiring a single throttler preset for public, authenticated and internal traffic.
- Treating a DTO as proof that a state transition is valid.
- Treating a passing happy-path test as proof of authorization.
