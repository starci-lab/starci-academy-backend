# Expert academy control center

> Business identity: `nivo/academy-control-center@1ee853b5fb1f388d076cdb02ae830116fae72fa2ce0fe14518d530f920a0866d`
>
> Source heads: `fe@97eec8c5bb4c`, `be@947c6f4a117e`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** An authenticated expert-site owner manages an academy through growth and system modes spanning business metrics, students and course access, lead CRM, credentials, custom domain and provider integrations.

**Primary actor.** Authenticated academy owner

**Primary outcome.** The academy owner sees only the selected owned site

**Never does.** Public learner classroom behavior

## Invariants

- `BR-01` — The control center first resolves ownership of the exact site and refuses an absent or unowned academy.
- `BR-02` — Domain blocks own their own requests and failures so one unavailable area does not erase the others.

## Primary flow

```text
restoring → ready → refused → empty
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `academy-control-center` | `/[locale]/apps/[siteId]` | Operate the growth and system concerns of one exact owned academy. | [surface](surfaces/academy-control-center.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `myAcademyGrowthSnapshot` | backend | siteId | academy growth snapshot |
| `myAcademyStudents` | backend | siteId, paging and filters | student page |
| `createAcademyStudent` | backend | siteId, name, email, optional password and role | created student |
| `grantAcademyCourseAccess` | backend | siteId, email, courseSlug | gifted course access |

## Explicit unknowns

- No unresolved question is recorded.

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
