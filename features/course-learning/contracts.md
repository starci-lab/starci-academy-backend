# Contracts · Course learning and discussion

## Entity · Lesson content (`lesson-content`)

Fields: `course`, `module`, `content`, `body`, `faces`, `source`, `outline`, `next steps`

Evidence: `EV-002`, `EV-003`

## Entity · Lesson comment (`lesson-comment`)

Fields: `content id`, `parent id`, `body`

Evidence: `EV-008`

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

No field, failure or operation may appear here without routed source evidence.
