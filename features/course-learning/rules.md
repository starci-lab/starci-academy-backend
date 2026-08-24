# Business rules · Course learning and discussion

## BR-01

A lesson can settle as pending, ready, locked or failed and exposes independently settling source, reaction and discussion regions.

- Strength: `confirmed`
- Evidence: `EV-003`

## BR-02

Read state and comments require authenticated course access guards.

- Strength: `confirmed`
- Evidence: `EV-007`, `EV-008`

## BR-03

Every learning module has exactly one required kind.

- Strength: `owner-confirmed`
- Evidence: `EV-014`

## BR-04

Chatbot and document are initial module kinds, not the complete or permanently closed kind set.

- Strength: `owner-confirmed`
- Evidence: `EV-014`

## BR-05

Shared module identity, ordering and lifecycle remain common while each kind owns its specific state, behavior and learner presentation.

- Strength: `owner-confirmed`
- Evidence: `EV-014`

## BR-06

Adding a future module kind must not redefine the business contract of the base learning-module aggregate.

- Strength: `owner-confirmed`
- Evidence: `EV-014`

## BR-07

A chatbot module opens a mailbox and conversation workspace; a document module opens a document workspace.

- Strength: `owner-confirmed`
- Evidence: `EV-014`
