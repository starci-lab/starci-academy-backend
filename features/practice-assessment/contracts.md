# Contracts · Practice and assessment

## Entity · Coding problem (`coding-problem`)

Fields: `slug`, `domain`, `statement`, `language`, `source code`, `test cases`

Evidence: `EV-003`, `EV-009`

## Entity · Coding submission (`coding-submission`)

Fields: `submission id`, `job id`, `verdict`

Evidence: `EV-009`

## Entity · Mock interview session (`mock-interview-session`)

Fields: `course`, `level`, `kind`, `session id`, `turns`, `current position`, `format total`, `status`, `last confirmed time`, `rubric`, `result`, `recommendations`

Evidence: `EV-006`, `EV-007`, `EV-008`, `EV-010`, `EV-015`

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

## Operation · resumableMockInterviewSession

- Kind/owner: `query` / `backend`
- Inputs: course
- Outputs: resumable session or none, server-confirmed position
- Failures: authentication rejected, session unavailable
- Evidence: `EV-015`

## Operation · submitMockInterviewTurn

- Kind/owner: `mutation` / `backend`
- Inputs: session id, current turn identity, learner answer
- Outputs: confirmed submitted turn, server-confirmed position, next prompt or completion state
- Failures: authentication rejected, session conflict, answer rejected, turn persistence failed
- Evidence: `EV-015`

## Operation · abandonMockInterviewSession

- Kind/owner: `mutation` / `backend`
- Inputs: session id, explicit learner confirmation
- Outputs: abandoned session status
- Failures: authentication rejected, session conflict, session abandonment failed
- Evidence: `EV-015`

## Operation · completeMockInterviewSession

- Kind/owner: `mutation` / `backend`
- Inputs: session id
- Outputs: grading status
- Failures: required turns incomplete, session conflict, assessment dispatch failed
- Evidence: `EV-015`

## Operation · mockInterviewDevelopment

- Kind/owner: `query` / `backend`
- Inputs: course, optional format, optional target level
- Outputs: graded attempt history, comparable progress or insufficient-data reason
- Failures: authentication rejected, history unavailable
- Evidence: `EV-015`

No field, failure or operation may appear here without routed source evidence or explicit owner-approved target authority.
