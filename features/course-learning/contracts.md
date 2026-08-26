# Contracts · Course learning and discussion

## Entity · Learning module (`learning-module`)

Fields: `id`, `course`, `title`, `description`, `position`, `kind`, `status`, `created at`, `updated at`, `conversation state`, `kind-specific workbench state`

Evidence: `EV-014`, `EV-015`

## Entity · Lesson content (`lesson-content`)

Fields: `course`, `module`, `content`, `body`, `faces`, `source`, `outline`, `next steps`

Evidence: `EV-002`, `EV-003`

## Entity · Lesson comment (`lesson-comment`)

Fields: `content id`, `parent id`, `body`

Evidence: `EV-008`

## Entity · Challenge attempt (`challenge-attempt`)

Fields: `id`, `learner id`, `course id`, `content id`, `challenge revision`, `rubric revision`, `draft revision`, `submission revision`, `answer or artifact references`, `idempotency key`, `status`, `created at`, `submitted at`

Evidence: `EV-016`

## Entity · Challenge evaluation and result (`challenge-evaluation`)

Fields: `attempt id`, `deterministic evidence`, `rubric criterion evidence`, `AI advisory evidence`, `confidence and uncertainty`, `platform decision`, `learner feedback`, `next action`, `finalization revision`, `finalized at`

Evidence: `EV-016`, `EV-017`

## Operation · markContentAsReaded

- Kind/owner: `mutation` / `backend`
- Inputs: content id, read flag
- Outputs: updated learner content state
- Failures: authentication rejected, course access rejected, content missing
- Evidence: `EV-007`

## Operation · createComment

- Kind/owner: `mutation` / `backend`
- Inputs: content id, optional parent comment, body
- Outputs: created comment
- Failures: authentication rejected, course access rejected, invalid parent or content
- Evidence: `EV-008`

## Operation · saveChallengeDraft

- Kind/owner: `mutation` / `backend`
- Inputs: learner identity, challenge revision, expected draft revision, answer or artifact references
- Outputs: saved draft revision, saved at
- Failures: authentication or course access rejected, challenge locked or missing, stale draft revision, invalid or unsupported artifact
- Evidence: `EV-016`

## Operation · submitChallengeAttempt

- Kind/owner: `mutation` / `backend`
- Inputs: learner identity, challenge revision, rubric revision, draft revision, idempotency key
- Outputs: immutable attempt revision, evaluation status
- Failures: authentication or course access rejected, challenge locked or stale, draft validation rejected, conflicting idempotency key
- Evidence: `EV-016`

## Operation · evaluateChallengeAttempt

- Kind/owner: `operation` / `backend`
- Inputs: immutable attempt revision, challenge revision, rubric revision, evaluation policy revision
- Outputs: deterministic evidence, rubric criterion evidence, AI advisory evidence, confidence and uncertainty
- Failures: objective validation failed, provider timeout or failure, malformed or low-confidence AI output, attempt or rubric revision mismatch
- Evidence: `EV-016`, `EV-017`

## Operation · finalizeChallengeResult

- Kind/owner: `mutation` / `backend`
- Inputs: attempt revision, evaluation evidence revision, platform policy revision
- Outputs: server-authoritative result, progress transition, audit revision
- Failures: evaluation unavailable, evidence or policy revision mismatch, duplicate or conflicting finalization
- Evidence: `EV-016`, `EV-017`

## Operation · retryChallengeAttempt

- Kind/owner: `mutation` / `backend`
- Inputs: learner identity, prior attempt revision
- Outputs: new draft revision, preserved attempt history
- Failures: authentication or course access rejected, retry policy rejected, prior attempt missing
- Evidence: `EV-016`

No field, failure or operation may appear here without routed source evidence.
