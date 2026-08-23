# Contracts · Trung tâm học tập cá nhân

## Entity · Con trỏ tiếp tục học (`resume-pointer`)

Fields: `topic`, `paper`, `reviewPhrase`

Evidence: `EV-001`, `EV-002`, `EV-003`

## Operation · continueLearning

- Kind/owner: `query` / `backend`
- Inputs: authenticated viewer
- Outputs: topic, paper, reviewPhrase
- Failures: GraphQL error envelope
- Evidence: `EV-003`

No field, failure or operation may appear here without routed source evidence.
