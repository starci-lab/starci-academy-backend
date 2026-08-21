# Shared console shell navigation

> Business identity: `nivo/console-shell-navigation@cf2a1014109b649182fbd9c35ebced77e948ad5edb66d689d17a22374f299aa4`
>
> Source heads: authority `pending` · `fe@3102d35bfa73`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Every authenticated console route shares one desktop navigation rail with expanded and compact presentations, while narrow screens use one right-edge drawer with the same destination identities.

**Primary actor.** Authenticated account owner

**Primary outcome.** The account owner keeps one stable way to navigate across every console route and viewport

**Never does.** Continuously resizable navigation width

## Invariants

- `BR-01` — The destination collection preserves one selected key, keyboard traversal, focus-visible feedback and the same destination order on every console route.
- `BR-02` — The desktop rail has exactly two persisted presentations: expanded at 256px and collapsed at 64px, toggled by one visible keyboard-operable control while the adjacent body reflows.
- `BR-03` — Collapsed destinations keep stable circular glyphs, accessible labels and target size; visible copy may disappear but destination meaning may not.
- `BR-04` — Collapse control and Overview remain pinned while only long destination groups own internal scrolling.
- `BR-05` — Below the desktop breakpoint the standing rail and bottom tab bar are absent; one right-edge drawer exposes the complete destination set.

## Primary flow

```text
expanded → collapsed → mobile-open
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `console-shell` | `/:locale/(overview|apps|agentos|wallet)` | Keep navigation identity, state and interaction stable while routed console content changes. | [surface](surfaces/console-shell.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| — | — | — | — |

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
