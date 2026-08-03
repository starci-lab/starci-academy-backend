# Content AI — findings

Ranked most severe first. Anchors are real `file:line` in the tree at scan time (2026-08-04).

## 1. [security] Every mutating session method is "check ownership, THEN write unscoped" — the exact anti-pattern `authorization.md` §3 warns against

`content-ai.service.ts`'s `saveTurn` (:1557-1616), `deleteSession` (:1623-1640),
`renameContentAiSession` (:1652-1680), `setContentAiSessionArchived` (:1689-1709), and `touchSession`
(:1719-1736) all follow the same shape: call `resolveOwnedSession(userId, sessionId)` (:1749-1768,
`SELECT ... WHERE s.id = $1 AND (e.user_id = $2 OR s.user_id = $2)`), and if it returns non-null,
issue a SEPARATE, un-scoped write keyed only on `sessionId` — e.g. `deleteSession`:
`this.entityManager.delete(ContentAiSessionEntity, { id: sessionId })` (:1634-1639, no `userId` in the
`where`), or the raw `UPDATE content_ai_sessions SET ... WHERE id = $1` calls in `renameContentAiSession`
/ `setContentAiSessionArchived` / `touchSession` / the title-bump in `saveTurn` (:1606-1615).

`canon/be/enforce/authoring/authorization.md` §3 names this shape by description almost verbatim: "a
handler that loads a row by id alone and then compares ownership in an `if` has already fetched data
the caller may not own, and that check is one refactor from being dropped. The predicate belongs in
the query." Here the predicate is IN the SELECT but NOT carried into the subsequent write — so the
write statement, read on its own by the next editor, looks like it deletes/updates any session by id
with no owner check at all; the ownership guarantee lives entirely in "a prior unrelated SELECT
happened to return non-null", which is exactly the shape a future refactor drops silently.

**What breaks**: currently nothing (there is no code path that reassigns a session's owner between the
SELECT and the write), but the pattern is structurally the IDOR class this file itself catalogues, and
whoever adds a batch-delete or an admin override next has no compiler-visible signal that the owner
check is load-bearing.

## 2. [naming / type-safety] The whole domain has no `types/` folder — every method's params and return type are inline, unlike its `ai-lab` sibling in the same bundle

`content-ai.service.ts` is 1861 lines and `src/modules/bussiness/content-ai/` has no `types/` or
`constants/` folder at all (`index.ts`, `.module.ts`, `.module-definition.ts`, `.service.ts`,
`.service.spec.ts` only). Every public method's params are destructured from an inline object-literal
type instead of a named interface — `loadSessionMessages` (:1522: `{ userId: string, sessionId:
string }`), `saveTurn` (:1564-1570), `deleteSession` (:1627), `renameContentAiSession` (:1657),
`setContentAiSessionArchived` (:1694), `touchSession` (:1723), `resolveLessonGrounding` (:303-308),
`resolveTaskGrounding`/`resolveChallengeGrounding`/`resolveQuizGrounding`/`resolveCourseGrounding`/
`resolveFoundationGrounding` (each repeats an almost-identical `{ userId, ...Id, question }` inline
shape), `resolveGrounding` (:619-624), and `prepareMessages`'s own return type
(`Promise<{ messages: Array<BaseMessage> }>`, :195) is inline too.

`canon/be/enforce/authoring/type-safety.md` §4 is explicit: "the params and result interfaces live in
the module's `types/` folder behind a barrel — never inline in the service." `ai-lab/` in this same
bundle is the compliant reference (`types/run.ts`, `types/eval.ts`, `types/cache.ts`, `types/metric.ts`,
`types/playground.ts` behind `types/index.ts`) — `content-ai/` is the drift, not a one-off lapse: it
is the entire domain's convention.

## 3. [naming] The GraphQL-facing name, the folder, and the class all disagree for the session-delete mutation

Folder: `src/features/api/core/graphql/mutations/contents/clear-content-ai-history/`. Class:
`ClearContentAiHistoryResolver` (`clear-content-ai-history.resolver.ts:35`). GraphQL schema name:
`deleteContentAiSession` (`clear-content-ai-history.resolver.ts:55-60`). Behavior: calls
`contentAiService.deleteSession(...)` (:62-65) — a hard delete of one session row (cascades its
messages), not a "clear history" (which would suggest wiping messages while keeping the session, or
clearing all of a scope's history). A reader who greps the schema for `deleteContentAiSession` and
then greps the source tree for a matching folder/class name finds neither — they have to know the
mutation's registered name doesn't match its own folder.

## 4. [jsdoc] `AskContentAiHandler` / `AskContentAiService` / `AskContentAiCommand` carry no JSDoc at all

`ask-content-ai.handler.ts` — the `AskContentAiHandler` class (:36-45) and its `process` method
(:47-49) have zero JSDoc, unlike every other CQRS handler and resolver reviewed in this bundle (the
resolver one directory up, `AskContentAiResolver`, has a real doc comment on `execute`).
`ask-content-ai.service.ts` — `AskContentAiService` (:19) and its `execute` method (:24) are also
undocumented; it is a two-line CQRS-dispatch shim, but `comments.md` §3 requires JSDoc on every public
class and method regardless of how thin the body is, and the ask-content-ai stack is the one place in
this domain where that lapsed.

## 5. [test-tier] No harness spec for the one content-AI answer that is genuinely non-deterministic — a smaller gap than `ai-lab`'s, not absent coverage

`content-ai.service.spec.ts` (838 lines) has strong unit coverage of `prepareMessages`'s
scope-dispatch, the per-scope entitlement gates, and session persistence (`createSession`/`saveTurn`
ownership branches) — this domain is NOT undertested the way `ai-lab`'s orchestration services are.
An e2e (`apps/core/test/app/content-ai-entitlement.e2e-spec.ts`) covers the premium/enrollment wiring
too. What is still missing is the harness lane for the actual generated answer: `askContentAi` /
`ask-content-ai` streams a real model's free-text tutoring reply through `AiInvokeService.run`
(`ask-content-ai.handler.ts:90-103`, `content-ai.gateway.ts:180-207`) with no fixed expected string —
exactly the "was this good, not was this equal" case `testing.md` §3's harness lane exists for. As
noted in the shared `ai-lab` findings, the lane is wired but zero `*.harness-spec.ts` files exist
anywhere yet; content-AI's tutoring answer is a second, independent candidate for the first one
written, alongside AI Lab's judge-kind eval cases.

## 6. [business-logic] Self-documented, already-tracked gap — noted, not double-counted

`resolveCourseGrounding` (:568-591) deliberately withholds course-wide RAG grounding from a
non-enrolled viewer entirely (rather than excluding only premium content) because
`retrieveCourseExcerpt` has no `excludeContentIds` filter yet, and says so in its own comment + a
named `TODO(content-ai-rail-scope)` (:562-563) pointing at the tracked follow-up
(`content-ai-chat-app-wide`). This is exactly the kind of decision `debt-ledger.md`-style tracking
exists for and it is already done in-code; listed here for completeness, not as a fresh finding.

---

**Axis tally**: security 1, naming 2, type-safety 1 (folded into #2), jsdoc 1, test-tier 1,
business-logic 0 (pre-existing tracked debt, not counted), edge-case 0, gate-middleware 0.
