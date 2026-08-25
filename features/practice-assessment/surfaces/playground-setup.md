# Surface · Prepare Playground

> ID: `playground-setup` · Route: `/[lang]/courses/[displayId]/learn/playground/[slug]`

## Job

Pair a machine, satisfy prerequisites and explicitly enter the guided session.

## Navigation

- Back to `playground-catalog`

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `playground-readiness` | flow | Playground identity; pairing status; readiness checks | pending, ready, empty, failed, expired | Verify setup; Enter Playground | `EV-014` |

## Context rule

Layout preview may show a pairing command, paired-machine snapshot, ordered prerequisites, expiry feedback and one readiness-derived entry action. Entry remains learner-controlled and disabled until every declared check is ready.
