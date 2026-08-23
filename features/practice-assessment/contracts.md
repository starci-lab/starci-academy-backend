# Contracts · Practice and assessment

## Entity · Coding problem (`coding-problem`)

Fields: `slug`, `domain`, `statement`, `language`, `source code`, `test cases`

Evidence: `EV-003`, `EV-009`

## Entity · Coding submission (`coding-submission`)

Fields: `submission id`, `job id`, `verdict`

Evidence: `EV-009`

## Entity · Mock interview session (`mock-interview-session`)

Fields: `course`, `level`, `kind`, `session id`, `turns`, `result`

Evidence: `EV-006`, `EV-007`, `EV-008`, `EV-010`

## Operation · submitCodingSolution

- Kind/owner: `mutation` / `backend`
- Inputs: problem slug, language, source code
- Outputs: submission id, job id
- Failures: authentication rejected, problem or language rejected, judge queue failed
- Evidence: `EV-009`

## Operation · startMockInterviewSession

- Kind/owner: `mutation` / `backend`
- Inputs: course, level, kind
- Outputs: persisted interview session
- Failures: authentication rejected, selection unavailable, session creation failed
- Evidence: `EV-010`

No field, failure or operation may appear here without routed source evidence.
