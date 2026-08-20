# Contracts · Study library

## Entity · Flashcard deck (`flashcard-deck`)

Fields: `id`, `title`, `description`, `difficulty`, `card count`, `due count`, `mastered count`

Evidence: `EV-002`

## Entity · Flashcard session (`flashcard-session`)

Fields: `session id`, `deck id`, `ordered cards`, `progress`, `result`

Evidence: `EV-001`, `EV-006`

## Entity · Foundation category (`foundation-category`)

Fields: `id`, `title`, `description`, `thumbnail`, `resources`

Evidence: `EV-003`, `EV-004`, `EV-007`

## Operation · startFlashcardReviewSession

- Kind/owner: `mutation` / `backend`
- Inputs: deck id, card order
- Outputs: resumable review session
- Failures: authentication rejected, deck unavailable, session creation failed
- Evidence: `EV-006`

## Operation · foundations

- Kind/owner: `query` / `backend`
- Inputs: category id, pagination
- Outputs: foundation page
- Failures: category missing, query failed
- Evidence: `EV-007`

No field, failure or operation may appear here without routed source evidence.
