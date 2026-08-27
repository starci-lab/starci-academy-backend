# Business rules · Projects and career

## PP-01

Only an authenticated learner enrolled in the course may submit or inspect private personal-project grading evidence.

- Strength: `confirmed`
- Evidence: `EV-007`, `EV-010`

## PP-02

The roadmap exposes deterministic milestone order, next task, completion, attempt count and score evidence; availability follows course progress rather than UI-local state.

- Strength: `confirmed`
- Evidence: `EV-004`, `EV-010`

## PP-03

The authored task brief remains readable when repository, model-catalog, attempt-history or feedback dependencies fail.

- Strength: `confirmed`
- Evidence: `EV-009`, `EV-010`

## PP-04

Repository URL, branch and private-token settings belong to the course enrollment and are reused across tasks; the token is write-only and only a last-four indicator may return.

- Strength: `confirmed`
- Evidence: `EV-007`, `EV-015`

## PP-05

The learner chooses the grading language and may deliberately choose Auto or any currently eligible concrete model. A concrete choice sends both model and provider; Auto delegates selection to the backend.

- Strength: `confirmed`
- Evidence: `EV-010`, `EV-011`, `EV-012`, `EV-014`

## PP-06

A submitted attempt binds task, repository URL, branch, language and grading choice as one review intent. A visible model selection that is not submitted is a contract failure.

- Strength: `confirmed`
- Evidence: `EV-010`, `EV-011`, `EV-012`

## PP-07

Each submission creates one asynchronous attempt. Queued, processing, failed and completed states remain distinguishable, and retry must not silently duplicate an in-flight attempt.

- Strength: `confirmed`
- Evidence: `EV-012`, `EV-016`

## PP-08

Completed attempts are immutable, newest-first and independently selectable. The result identifies score, verdict, served model or provider, time and structured findings.

- Strength: `confirmed`
- Evidence: `EV-003`, `EV-013`

## PP-09

A failed attempt returns the learner to revision with preserved settings and actionable findings; a passed attempt unlocks the deterministic next task.

- Strength: `confirmed`
- Evidence: `EV-004`, `EV-010`, `EV-013`

## PP-10

Unavailable or unentitled models explain their unavailable state and cannot be submitted; a model becoming unavailable during submit yields actionable recovery.

- Strength: `confirmed`
- Evidence: `EV-011`, `EV-012`

## PP-11

Personal Project remains independent from Challenge while their AI-grading behavior may be UAT-tested together after both deliveries.

- Strength: `confirmed`
- Evidence: `EV-010`

## BR-03

The headhunting directory separates company and consultant results and can mark individual actions unavailable.

- Strength: `confirmed`
- Evidence: `EV-005`, `EV-008`
