# Contracts · Học nội dung và làm thử thách khóa học

## Entity · Nội dung khóa học (`course-content`)

Fields: `id`, `displayId`, `title`, `description`, `body`, `isPremium`, `minutesRead`, `module`, `challenges`

Evidence: `EV-001`, `EV-002`, `EV-003`

## Entity · Bài nộp thử thách (`challenge-submission`)

Fields: `challengeSubmissionId`, `githubUrl`, `selectedModel`, `lang`, `jobId`

Evidence: `EV-001`, `EV-002`, `EV-003`

## Operation · content

- Kind/owner: `query` / `frontend`
- Inputs: content request, bearer token
- Outputs: localized content, module position, challenges
- Failures: Not entitled, Not found, GraphQL error
- Evidence: `EV-002`, `EV-003`

## Operation · submitChallengeSubmission

- Kind/owner: `mutation` / `frontend`
- Inputs: challengeSubmissionId, optional GitHub URL/model/lang
- Outputs: jobId
- Failures: Submission rejected, Grading job not queued
- Evidence: `EV-002`, `EV-003`

No field, failure or operation may appear here without routed source evidence.
