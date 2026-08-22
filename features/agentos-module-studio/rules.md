# Business rules · AgentOS custom module studio

## BR-01

Every custom module, intake session, attachment, configured-secret status and generated specification belongs to one exact authenticated owner and one exact ready AgentOS workspace.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-010`

## BR-02

The backend owns required fields, the next follow-up question, structured profile, missing fields, progress and completion; the frontend renders those results and never invents readiness.

- Strength: `confirmed`
- Evidence: `EV-001`

## BR-03

Each accepted answer or correction is persisted before the next question is selected, and a changed answer may change every later unresolved question.

- Strength: `confirmed`
- Evidence: `EV-001`

## BR-04

A custom-module draft is resumable after navigation, reload or a local operation failure without duplicating the draft or discarding previously accepted information.

- Strength: `confirmed`
- Evidence: `EV-001`

## BR-05

Integration key values are write-only, encrypted server-side and never returned, rendered, placed in conversation text or logged; clients receive only masked configuration status.

- Strength: `confirmed`
- Evidence: `EV-001`

## BR-06

An image or document attachment contributes to the module profile only after quarantine and successful scanning; uploading, scanning, ready, refused, retry and removal remain explicit states.

- Strength: `confirmed`
- Evidence: `EV-001`

## BR-07

Conversation completion generates a reviewable versioned specification but never publishes or installs a module without a separate explicit owner confirmation.

- Strength: `confirmed`
- Evidence: `EV-001`

## BR-08

Custom-module drafts and their studio do not replace or mutate the existing immutable solution-module catalogue, catalogue installation operation or installation-detail identity.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-009`, `EV-010`

## BR-09

Interview, attachment, secret and publish failures are independent block-state axes; a refusal preserves every other previously accepted part of the module profile.

- Strength: `confirmed`
- Evidence: `EV-001`

## BR-10

The TEDO page contributes interaction shape only; none of its project content, prices, artifact promises, actors or business rules becomes Nivo product truth.

- Strength: `confirmed`
- Evidence: `EV-001`
