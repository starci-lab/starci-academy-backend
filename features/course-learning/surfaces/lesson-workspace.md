# Surface · Lesson workspace

> ID: `lesson-workspace` · Route: `/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]`

## Job

Read lesson content and use its engagement tools.

## Navigation

- none

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `lesson-reader` | content | Lesson title; Reading, source or challenge; Course progress | pending, ready, locked, failed | Mark read, React | `EV-002`, `EV-003`, `EV-007`, `EV-011` |
| `lesson-discussion` | flow | Comments; Write a comment | pending, ready, empty, failed | Post comment, Try again | `EV-003`, `EV-008` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
