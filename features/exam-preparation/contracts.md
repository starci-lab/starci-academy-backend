# Contracts · Ôn tập ngôn ngữ và làm đề thi

## Entity · Đề thi (`exam-paper`)

Fields: `id`, `slug`, `kind`, `level`, `durationMinutes`, `questionCount`, `title`, `isDemo`, `isLocked`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

## Entity · Lượt làm đề (`exam-attempt`)

Fields: `attemptId`, `paper`, `answers`, `score`, `maxScore`, `submittedAt`, `secondsSpent`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

## Entity · Chủ đề học (`study-topic`)

Fields: `id`, `slug`, `phrases`, `progress`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

## Operation · papers

- Kind/owner: `query` / `backend`
- Inputs: authenticated learner
- Outputs: visible paper catalog
- Failures: Unauthenticated, GraphQL error
- Evidence: `EV-002`, `EV-003`, `EV-004`

## Operation · gradePaper

- Kind/owner: `mutation` / `backend`
- Inputs: paper slug, selected answers, seconds spent
- Outputs: attemptId, score, maxScore, graded answers
- Failures: Paper not found, Invalid answer payload
- Evidence: `EV-002`, `EV-003`, `EV-004`

No field, failure or operation may appear here without routed source evidence.
