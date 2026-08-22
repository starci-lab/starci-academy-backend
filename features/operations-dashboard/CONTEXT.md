# Operations dashboard

> Business identity: `nivo/operations-dashboard@3a9e04235aa047ce0d24a51770a2bb11e4a0c3f241bc2381f8723c3ce404fc78`
>
> Source heads: authority `implemented` · base `cecf53f7f29811d83a18c70a8c064abe3387037114da1f9efedb9fc08d86a991` · `fe@894e608bba73`, `be@ac05d90e7b6b`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** The authenticated console overview independently summarizes owned apps, AgentOS workspaces, infrastructure context, domains and account wallet state, preserving partial answers when another section is refused.

**Primary actor.** Authenticated account owner

**Primary outcome.** The owner sees every answer that succeeded even when another query is refused

**Never does.** Standalone Servers, Domains or Support destinations

## Invariants

- `BR-01` — Each overview section settles independently; one refusal does not turn the whole dashboard into an error.
- `BR-02` — List responses without a declared total are represented by members and navigation, not an invented count.
- `BR-03` — Below the desktop breakpoint, console destinations live in one right-edge drawer opened by a visible menu control; the standing rail and bottom tab bar are absent.

## Primary flow

```text
resting → empty → answered
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `operations-overview` | `/[locale]/overview` | Scan the account's current service and money state from one protected page. | [surface](surfaces/operations-overview.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `myExpertSites` | backend | none | owned expert sites |
| `myAgentWorkspace` | backend | none | owned AgentOS workspace |
| `myDomains` | backend | none | owned domains |
| `myWallet` | backend | none | wallet balance |

## Explicit unknowns

- `standalone-console-destinations` — When will Servers, Domains and Support have standalone routes? Impact: They are visible in navigation, but current destinations are deliberately unavailable.

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
