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

## BR-08

Challenge access requires authenticated course access and direct-route entry cannot bypass eligibility.

- Strength: `owner-confirmed`
- Evidence: `EV-016`

## BR-09

Each challenge attempt binds the exact learner, challenge and rubric revisions while draft and submitted versions remain distinct.

- Strength: `owner-confirmed`
- Evidence: `EV-016`

## BR-10

Challenge submission is idempotent and never silently destroys or replaces the learner draft.

- Strength: `owner-confirmed`
- Evidence: `EV-016`

## BR-11

Deterministic validation owns objective checks; AI evaluates only declared rubric criteria that require semantic judgment.

- Strength: `owner-confirmed`
- Evidence: `EV-016`

## BR-12

AI output is advisory evidence and platform policy alone finalizes pass, needs-revision, evaluation-unavailable and learner progress.

- Strength: `owner-confirmed`
- Evidence: `EV-016`

## BR-13

Challenge feedback binds each criterion to attempt evidence, the observed gap, uncertainty and a next action without inventing evidence or exposing hidden data.

- Strength: `owner-confirmed`
- Evidence: `EV-016`, `EV-017`

## BR-14

Hints are progressive and cannot reveal a complete solution before completion unless the authored challenge policy explicitly permits it.

- Strength: `owner-confirmed`
- Evidence: `EV-016`, `EV-017`

## BR-15

Prompt injection, irrelevant learner content and embedded instructions cannot change the challenge rubric, authority, tools or data boundary.

- Strength: `owner-confirmed`
- Evidence: `EV-016`, `EV-017`

## BR-16

Timeout, provider failure, malformed output or low confidence settles as evaluation-unavailable with safe recovery and never consumes a retry or fabricates a score.

- Strength: `owner-confirmed`
- Evidence: `EV-016`, `EV-017`

## BR-17

Retry creates a new attempt version while preserving prior submissions, feedback and finalization history.

- Strength: `owner-confirmed`
- Evidence: `EV-016`

## BR-18

Challenge result and progress transitions are auditable and finalize once under duplicate, concurrent or resumed requests.

- Strength: `owner-confirmed`
- Evidence: `EV-016`, `EV-017`

## BR-19

Locale and answer style may change explanation language but not rubric meaning or outcome.

- Strength: `owner-confirmed`
- Evidence: `EV-016`, `EV-017`

## BR-20

A Challenge definition preserves prerequisites, scored requirements, guided steps, expected outputs, hint policy and one or more typed deliverables as distinct authored groups; absent optional groups are omitted rather than duplicated from the description.

- Strength: `owner-confirmed`
- Evidence: `EV-018`, `EV-019`, `EV-020`

## BR-21

The learner chooses a grading model from the currently eligible catalog; the platform may recommend Automatic but cannot silently replace an explicit learner choice.

- Strength: `owner-confirmed`
- Evidence: `EV-018`, `EV-020`

## BR-22

The selected grading model and eligible-catalog revision bind the immutable attempt but cannot alter the Challenge rubric, deterministic checks, finalization policy or progress authority.

- Strength: `owner-confirmed`
- Evidence: `EV-016`, `EV-018`, `EV-020`

## BR-23

If the selected model becomes unavailable before evaluation, the attempt is preserved and settles as evaluation-unavailable with an explicit resume or choose-another-model action; no silent provider fallback is allowed.

- Strength: `owner-confirmed`
- Evidence: `EV-017`, `EV-018`, `EV-020`

## BR-24

The Challenge surface exposes one course-context breadcrumb and one exit action per action region; task copy is not repeated as briefing or deliverable guidance.

- Strength: `owner-confirmed`
- Evidence: `EV-019`, `EV-020`

## BR-25

Challenge delivery remains incomplete until semantic interaction tests, exact-revision visual fidelity and signed-in desktop/mobile learner-flow UAT all pass.

- Strength: `owner-confirmed`
- Evidence: `EV-020`
