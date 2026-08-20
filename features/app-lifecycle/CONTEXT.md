# Template app lifecycle

> Business identity: `nivo/app-lifecycle@2045cdf4a9b8b09eea639d599b6db17a1ee2b825491584c551296c0d3d5162fc`
>
> Source heads: `fe@97eec8c5bb4c`, `be@947c6f4a117e`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** An authenticated owner browses template offers beside owned apps, starts the supported academy template, and follows its isolated provisioning snapshot through request, build, ready or failed states into its control center.

**Primary actor.** Authenticated app owner

**Primary outcome.** A draft expert site and deployment identity are created

**Never does.** Provisioning catalogue templates not wired by the frontend

## Invariants

- `BR-01` — Owned apps and buyable templates share the same Apps surface but keep distinct lifecycle and price semantics.
- `BR-02` — Only the ai_academy template currently exposes a build action; other named templates remain unavailable.

## Primary flow

```text
catalog-loading → request → submitting → accepted
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `apps-catalogue` | `/[locale]/apps` | Review owned apps and start another from the template catalogue. | [surface](surfaces/apps-catalogue.md) |
| `template-app-provisioning` | `/[locale]/apps/new/[templateKey] | /[locale]/apps/[siteId]/provisioning` | Create or resume one exact template-app provisioning flow. | [surface](surfaces/template-app-provisioning.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `catalogItems` | backend | site_from_template | template offers and tiers |
| `createExpertSite` | backend | slug | draft expert site |
| `myExpertSiteDeployment` | backend | siteId | latest deployment snapshot |

## Explicit unknowns

- `additional-template-provisioners` — Which catalogue templates beyond ai_academy will receive provisioning flows? Impact: They may be listed, but the current UI correctly labels them unavailable instead of inventing behavior.

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
