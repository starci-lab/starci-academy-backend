# Surface · Project consultation

> ID: `consultation-chat` · Route: `/[locale]/chat`

## Job

Turn an initial project prompt into a progressively qualified project scope.

## Navigation

- none

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `project-prompt` | form | Project description; Suggested prompts | ready, validation-error | Start consultation | `EV-001`, `EV-003`, `EV-005` |
| `consultation-thread` | flow | Messages; Attachments; Requirements progress; Quote status | pending, ready, partial, error | Send message, Attach file | `EV-001`, `EV-005`, `EV-006`, `EV-008` |
| `follow-up-lead` | form | Name; Phone; Email; Company; Zalo, phone or email; Consent | idle, sending, sent, error | Request follow-up | `EV-004`, `EV-007` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
