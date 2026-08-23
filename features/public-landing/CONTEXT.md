# Public nivo landing

> Business identity: `nivo/public-landing@d0fecdaed1f8a4ac8cbd46f30e0b98fdaa93c209f84408669aeb99d5f0216b09`
>
> Source heads: authority `implemented` · base `b0da977340dc52c1d141196104615d7dd75fcfef1e48a2002c5c446feddd5e64` · `fe@894e608bba73`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** The root landing route presents the nivo brand and a concise product description without requesting session or backend data.

**Primary actor.** Public visitor

**Primary outcome.** The visitor receives a stable public brand landing surface

**Never does.** Authentication or console actions

## Invariants

- `BR-01` — The landing page makes no request and contains no authenticated behavior.

## Primary flow

```text
ready → ready
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `public-landing` | `/` | Introduce the product before any account or service journey begins. | [surface](surfaces/public-landing.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| — | — | — | — |

## Explicit unknowns

- `landing-next-action` — What public next action should the landing page offer? Impact: The implemented screen contains identity and description only, so no authentication or product CTA can be claimed.

## LOADS

| Need | Read |
|---|---|
| Scope, terminology and exclusions | [overview.md](overview.md) |
| Actor permissions and ownership | [actors.md](actors.md) |
| One user journey | `flows/<flow-id>.md` |
| One renderable screen | `surfaces/<surface-id>.md` |
| Business invariants | [rules.md](rules.md) |
| State transitions | [states.md](states.md) |
| Entities, inputs, outputs and failures | [contracts.md](contracts.md) |
| Completion and regression proof | [acceptance.md](acceptance.md) |
| Machine rendering/query | [model.json](model.json) |
| Exact source provenance | [evidence.json](evidence.json) |

## Context rule

Do not load every module by default. `CONTEXT.md` plus the one flow or surface being changed is the normal prompt. `model.json` is authoritative for machines; Markdown files are generated projections. Unknowns remain unknown until routed source or an explicit owner decision resolves them.
