# Contracts · Phỏng vấn, dự án cá nhân và playground

## Entity · Phiên phỏng vấn (`mock-interview-session`)

Fields: `sessionId`, `promptId`, `difficulty`, `level`, `mode`, `seedTopics`, `deadlineAt`

Evidence: `EV-001`, `EV-002`, `EV-003`

## Entity · Task dự án cá nhân (`personal-project-task`)

Fields: `taskId`, `title`, `status`, `completionPercent`, `attempt`, `feedback`

Evidence: `EV-001`, `EV-002`, `EV-003`

## Entity · Phiên playground (`playground-session`)

Fields: `id`, `pairingCode`, `mode`, `steps`

Evidence: `EV-001`, `EV-002`, `EV-003`

## Operation · startMockInterviewSession

- Kind/owner: `mutation` / `frontend`
- Inputs: courseId, level, mode, language/question settings
- Outputs: sessionId, seedTopics, deadlineAt
- Failures: Not entitled, No question bank, GraphQL error
- Evidence: `EV-002`, `EV-003`

## Operation · createPlaygroundSession

- Kind/owner: `mutation` / `frontend`
- Inputs: playgroundId, guided/free mode
- Outputs: session id, pairingCode, ordered steps
- Failures: Not enrolled, Not entitled, GraphQL error
- Evidence: `EV-002`, `EV-003`

No field, failure or operation may appear here without routed source evidence.
