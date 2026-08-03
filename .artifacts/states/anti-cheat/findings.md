# Anti-cheat — findings

Graded against `.claude/canon/be/INDEX.md` and its `enforce/authoring/*` shelves, with extra scrutiny
per this domain's security-sensitive role. Ranked most severe first.

## security

1. **`src/modules/bussiness/anti-cheat/anti-cheat.service.ts:38-45`** — a submission with no
   `telemetry` payload at all is unconditionally scored `suspicionScore: 0, flagged: false`. This is
   documented as accommodating "old clients", and is exercised on purpose by
   `anti-cheat.service.spec.ts:31-42` ("treats a missing telemetry payload as not suspicious"), so it
   is a deliberate design choice, not an oversight — but the practical consequence is that the ENTIRE
   detection mechanism is opt-in from an adversarial client's point of view: nothing on the request
   path requires `telemetry` to be present, so the trivial bypass for anyone who actually wants to
   paste an AI-generated solution is to simply omit the field the honest FE always sends. A
   heuristic anti-cheat system whose most effective evasion is "don't send the optional signal" is
   filed here as a judgement call the canon has no rule for, but the risk is real: every one of the
   five heuristics this domain implements can be defeated in one step, for free, by any client that
   doesn't run the official FE.

## business-logic

2. **`flaggedForReview` / `suspicionScore` / `clientTelemetry` have no reader anywhere in `src/`.**
   `coding-submission.service.ts:114-115` writes all three onto `CodingSubmissionEntity` on every
   submission; grep across `src/features/api/core/graphql/**` and `apps/` finds no query, resolver, or
   job that ever reads them back. The scoring work happens on every single submission and its output
   is currently unreachable — there is no admin "flagged submissions" view, no `myCodingSubmissions`
   field exposing the flag to a reviewer, nothing. Until a consumer exists, this domain computes a
   number and throws it away.

## naming (structure)

3. **`src/modules/bussiness/anti-cheat/` has no `<domain>.module.ts`**, same gap as its sibling
   `device` domain (see `.artifacts/states/device/findings.md` finding 2 for the fuller writeup —
   the same file-shape gap applies verbatim here): no `@Module` wrapper, `AntiCheatService` registered
   as a bare provider directly inside `coding.module.ts:17,34,41`, and NOT re-exported from
   `src/modules/bussiness/index.ts` (every other business domain is). Per
   [[naming-and-structure]] §1/§3/§6, a capability this codebase otherwise always wraps in its own
   module is instead reachable only through its one consumer.

## edge-case

4. **`src/features/api/core/graphql/mutations/coding/submit-coding-solution/graphql-types/telemetry.input.ts:14-59`**
   — none of the five optional numeric telemetry fields carry `@IsInt`/`@Min(0)` validation. A client
   can send a negative `pasteSizeMax` or `timeOpenToSubmitMs`; `evaluate()`'s comparisons
   (`pasteSizeMax >= codeLength * 0.6`, `timeOpenToSubmitMs < 15_000`) do not explicitly special-case
   a negative value, so a crafted negative `timeOpenToSubmitMs` (e.g. `-1`) passes
   `timeOpenToSubmitMs > 0` as false and silently skips the fast-submit heuristic without tripping any
   other check — a second, narrower bypass beyond finding 1.

## test-tier

5. **Unit coverage of `AntiCheatService.evaluate()` itself is thorough** (14 cases in
   `anti-cheat.service.spec.ts`, covering every heuristic, every guard boundary, and the clamp) — this
   is the one part of the domain [[testing]] is fully satisfied on. The gap is downstream: no e2e spec
   exercises `submitCodingSolution` end-to-end to prove `suspicionScore`/`flaggedForReview` actually
   land on the persisted row against a real schema (same gap noted for the `device` domain, which
   shares this call site).
