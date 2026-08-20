# Contracts · Luyện bài coding và nhận verdict

## Entity · Bài coding (`coding-problem`)

Fields: `id`, `slug`, `title`, `difficulty`, `domain`, `points`, `tags`

Evidence: `EV-001`, `EV-002`, `EV-003`

## Entity · Bài nộp coding (`coding-submission`)

Fields: `submissionId`, `jobId`, `slug`, `language`, `sourceCode`, `telemetry`, `verdict`

Evidence: `EV-001`, `EV-002`, `EV-003`

## Operation · codingProblems

- Kind/owner: `query` / `frontend`
- Inputs: domain, difficulty, tag, page, limit
- Outputs: total, problem rows
- Failures: GraphQL error
- Evidence: `EV-002`, `EV-003`

## Operation · submitCodingSolution

- Kind/owner: `mutation` / `frontend`
- Inputs: slug, language, sourceCode, optional telemetry
- Outputs: submissionId, jobId
- Failures: Unsupported language, Judge queue failure, GraphQL error
- Evidence: `EV-002`, `EV-003`

No field, failure or operation may appear here without routed source evidence.
