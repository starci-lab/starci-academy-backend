# Contracts · Công cụ ôn tập trong khóa học

## Entity · Bộ flashcard (`flashcard-deck`)

Fields: `id`, `displayId`, `title`, `difficulty`, `dueCount`, `masteredCount`, `cards`

Evidence: `EV-001`, `EV-002`

## Entity · Tài nguyên nền tảng (`foundation-resource`)

Fields: `categoryId`, `foundationId`, `title`, `body`

Evidence: `EV-001`, `EV-002`

## Entity · Mục công cụ khóa học (`course-tool-item`)

Fields: `id`, `title`, `description`, `status`

Evidence: `EV-001`, `EV-002`

## Operation · flashcardDecksByCourse / myDueFlashcards

- Kind/owner: `query` / `frontend`
- Inputs: courseId, limit
- Outputs: decks, due cards
- Failures: GraphQL error, Empty deck inventory
- Evidence: `EV-002`

No field, failure or operation may appear here without routed source evidence.
