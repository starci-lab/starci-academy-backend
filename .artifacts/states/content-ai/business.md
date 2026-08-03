# Content AI — business map

Content AI is the "ask the tutor" surface: a learner asks a free-text question grounded in whatever
they currently have open — a lesson, a capstone/personal-project task, a hands-on challenge, a
flashcard quiz, a global foundation-library doc, or a whole course — and gets back a streamed,
grounded answer from a **free-tier** model (no AI-credit gate; the free local model serves it, and
only climbs to a paid model if every free option fails, at which point the learner IS billed). The
conversation itself is optionally persisted as a named, searchable session; the raw Q&A pair for a
turn that is not saved to a session is never persisted at all.

## The six scopes — one state machine, six anchors

Every session and every turn carries exactly one `scope`, and the scope decides which single column
anchors it:

| Scope | Anchor column | Entitlement | Grounding source |
|---|---|---|---|
| `content` | `originContentId` | lesson's enrollment (trial counts); premium content gated separately at answer time | MinIO lesson body + repo code (RAG above a size threshold) |
| `task` | `originTaskId` | task → course → enrollment (trial counts) | milestone RAG chunk |
| `challenge` | `originChallengeId` | challenge → course → enrollment (trial counts) | challenge brief / test cases |
| `quiz` | `originQuizId` | quiz deck → course → enrollment (trial counts) | quiz deck material |
| `course` | (enrollment only, no per-item anchor) | course's enrollment (trial counts) | course-wide RAG |
| `foundation` | `originFoundationId` | **none — global**, keys off the raw `userId` | single-doc RAG, no course gate |

Priority when a caller supplies more than one anchor id (both `prepareMessages` and `createSession`
resolve it the same way): `contentId > taskId > challengeId > quizId > foundationId > courseId`.

## Entities and their invariants

- **ContentAiSession** — one named conversation. `scope` decides which of `enrollment` / `user` is
  the owner: a course-scoped session (`content`/`task`/`challenge`/`quiz`/`course`) is owned via its
  `enrollment` (so `enrollmentId` is set, `userId` is null); a `foundation` session is owned via the
  raw `user` (so `userId` is set, `enrollmentId` is null). **Invariant**: exactly one of
  `enrollment`/`user` is non-null on any row, mirroring which scope it is. `archivedAt` non-null drops
  it from the default list but keeps it searchable; a session may be **born archived** (selection-
  passage "explain this" side-threads) so it never clutters the list yet stays findable.
- **ContentAiMessage** — one turn (`role: "user" | "assistant"`) under a session. Inherits the
  session's owner anchor. A `content`-scope turn additionally records the `content` it was grounded
  on, so one conversation can legitimately span several lessons.

## State machine — a session's lifecycle

```
created (untitled, title = null)
   │  saveTurn (first Q&A)
   ▼
titled (title auto-derived from the first question, ≤120 chars)
   │  renameContentAiSession (explicit)          │  setContentAiSessionArchived(true)
   ▼                                              ▼
renamed (title overwritten outright,          archived (archivedAt = now(); drops from
  blank title resets to null → reverts          default list, still searchable / reopenable)
  to auto-titling on the next turn)                 │  setContentAiSessionArchived(false)
                                                     ▼
                                                 active again (archivedAt = null)
```

- Every mutating operation (`saveTurn`, `deleteSession`, `renameContentAiSession`,
  `setContentAiSessionArchived`, `touchSession`) first resolves ownership
  (`resolveOwnedSession`: session owned via `enrollment.userId = caller` OR `session.userId =
  caller`) and **silently no-ops** when not owned — a stray or forged `sessionId` never throws, it
  just does nothing. This is a deliberate "safe no-op" invariant, not a bug: a saveTurn call racing
  against a session the FE hasn't confirmed yet must not surface an error to a learner who otherwise
  got a perfectly good streamed answer.
- `touchSession` bumps `updatedAt` on open — this is how "reopen the conversation I was last reading"
  is remembered server-side rather than in browser storage.
- An answer is **only** persisted when `sessionId` is supplied by the caller AND `saveTurn` succeeds;
  a plain one-shot `askContentAi` (GraphQL mutation, no socket) or a socket ask with no `sessionId`
  produces an answer the FE receives but the backend never writes to a table — the conversation is
  ephemeral unless the FE explicitly asks it to be remembered.

## What the FE can read off this

- **Ask** — `askContentAi` mutation (one-shot, non-streamed) or the `/content_ai` Socket.IO namespace
  (`ask-content-ai` → streamed token deltas → a `done: true` terminal chunk). Both share the exact
  same grounding + premium-gate logic (`ContentAiService.prepareMessages`) so the one-shot and
  streaming answers to the same question are never allowed to drift.
- **List / search** — `contentAiSessions` lists the current scope's conversations recency-first;
  a non-empty `search` on the `content` scope widens to search **every** course conversation the
  learner has (so an old "kafka" chat from another lesson is findable); other scopes search only
  their own scope's sessions.
- **Read** — `contentAiSessionMessages` returns a session's saved turns oldest-first (rebuilds the
  thread on reopen).
- **Manage** — `createContentAiSession`, `renameContentAiSession`, `deleteContentAiSession` (GraphQL
  name; the mutation folder/class are named `clear-content-ai-history` / `ClearContentAiHistoryResolver`
  — see findings), `setContentAiSessionArchived`, `touchContentAiSession`.
- **No AI-credit ledger** for content-AI turns on the free path — `AiEntitlementService.consume` is
  still called (billing by whichever model actually served, free = 0 cost) so a climbed paid model
  is billed, but the conversation/messages themselves carry no cost fields.
