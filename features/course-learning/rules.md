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

Chat is a shared capability of every learning module and is not one module kind; document, accounting or spreadsheet, scheduling or calendar, and future kinds identify workbench behavior.

- Strength: `owner-confirmed`
- Evidence: `EV-015`

## BR-05

Shared module identity, ordering, lifecycle and conversation frame remain common while exactly one module kind owns the additional workbench state, behavior and learner presentation.

- Strength: `owner-confirmed`
- Evidence: `EV-015`

## BR-06

Adding a future module kind must not redefine the business contract of the base learning-module aggregate.

- Strength: `owner-confirmed`
- Evidence: `EV-014`, `EV-015`

## BR-07

Opening any module mounts one shared conversational shell and exactly one workbench resolved from its kind registry entry.

- Strength: `owner-confirmed`
- Evidence: `EV-015`
