# Continue on laptop — contract-owned shape

Date: 2026-08-17

## Context

| Field | Value |
|---|---|
| Source / Backend | `D:\Repositories\starci-academy-backend` |
| Source branch | `mtp` |
| Frontend | `D:\Repositories\starci-academy-fe` |
| Frontend branch | `main` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Workflow root | `D:\Repositories\starci-academy-backend\.workflows` |

This file is a handoff only. The shell-to-contract refactor described below has not been implemented on this machine.

## Founder decision

The contract registry is the only source of truth for visible shape.

```text
Business intent
  -> layout gate JSON
  -> contract keys and named slots
  -> branches assemble the tree
  -> vendor mechanics execute behavior invisibly
```

- A contract owns host semantics, layout classes, width, placement, padding, gap, overflow, visible order, named slots and the reason for the arrangement.
- A branch selects a contract and fills its named slots.
- Vendor mechanics may own focus trapping, portal mounting, Escape, backdrop dismissal, scroll locking, keyboard navigation and framework conversion.
- Mechanics must not create a second visible layout source.
- The LLM must be able to determine the complete visible shape by reading the contract registry and gate JSON. It must not need to inspect a mechanics implementation.
- Remove `shell` as a design/context tier. Move the current shell implementations under `src/components/branches` and rename them by their actual mechanical responsibility.

## Current source to migrate

| Current file | Target responsibility |
|---|---|
| `src/components/shells/RouteShell/index.tsx` | `branches/RouteComponentAdapter`: Next.js `children` to `ComponentType`; no visible node or layout decision |
| `src/components/shells/ModalShell/index.tsx` | `branches/ModalMechanics`: HeroUI modal lifecycle only |
| `src/components/shells/DrawerShell/index.tsx` | `branches/DrawerMechanics`: HeroUI drawer lifecycle only |
| `src/components/shells/DropdownShell/index.tsx` | split into a contract-owned menu branch plus `branches/DropdownMechanics` for HeroUI focus, popover, keyboard and selection behavior |

Delete `src/components/shells` after imports and tests have migrated. Do not preserve it as an alias or compatibility barrel.

## Contract changes

1. Extend the contract registry so an entry can name the mechanics it requires without hiding visible shape in that mechanics file. Prefer a closed discriminated union, not arbitrary strings or component references.
2. Add/complete contracts for modal, drawer and dropdown visible anatomy: surface, heading, body, footer/actions, trigger, header, sections and items.
3. Move every presentation literal currently inside the shell files into those contracts or their contract-bound leaves:
   - `button button--md button--tertiary button--icon-only rounded-full`
   - `border-b border-separator`
   - `text-danger-soft-foreground`
   - modal cover padding
   - modal/drawer body inset reset
   - drawer placement and modal width when they affect visible layout
4. Branches must use `defineContractComponent` / `defineContractProjection` and named slots. No anonymous structural `children` hole is introduced.
5. Keep data JSON-safe and handlers in the `on` lane.
6. Update every import, contract type test and affected component test. Preserve focus, Escape, backdrop, keyboard and selection behavior.

## Canon and lint changes

Add the rule to canon first, with twin tests, then publish and consume it. Do not create a local-only copy in StarCi FE.

Required machine-checkable policies:

1. `no-shell-tier`
   - forbid `src/components/shells`;
   - forbid `meta.shape === "shell"`;
   - forbid imports containing `/shells/`.
2. `contract-owns-visible-shape`
   - a mechanics branch may not contain presentation/layout `className` literals;
   - it may not accept `className`, style slots or arbitrary presentation props;
   - visible structure must resolve through a registered contract key.
3. `mechanics-do-not-assemble-content`
   - mechanics may project vendor compound anatomy but may not decide business child order or invent anonymous wrappers;
   - business regions and repeated runs must arrive as typed contract slots/data.
4. `no-structural-arrangement-in-leaf` and `no-host-not-in-leaves` remain strict. Do not evade them by renaming a structural component to `Mechanics`.
5. Add real-table tests against StarCi FE in addition to unit fixtures, so vendor compound APIs do not create false positives.

## Canon package

Registry inspection on 2026-08-17:

- package: `@starci/eslint-canon-fe`
- latest: `1.0.1`
- Node: `>=20.9.0`
- peer: `eslint >=9`
- exports: `.`, `./contracts`, `./props`

Install it as a project dev dependency, not as a global package and not with legacy peer resolution:

```powershell
npm install --save-dev @starci/eslint-canon-fe@1.0.1
```

After publishing the new rules, install the new exact version and wire the flat config at severity `error`. Never use `--legacy-peer-deps`.

## Required execution order

1. Pull `starci-academy-backend/mtp` and `starci-academy-fe/main` on the laptop.
2. Measure current imports, tests, lint and contract registry entries.
3. Run the StarCi upgrade Plan -> Review -> Apply lifecycle for the canon wording and tests.
4. Publish a new `@starci/eslint-canon-fe` version.
5. Run lint-sync Plan -> Review -> Apply for StarCi FE.
6. Refactor the four current shell implementations and their call sites.
7. Delete `src/components/shells` only after `rg` finds no imports or tier markers.
8. Run focused tests, full tests, TypeScript, ESLint, production build and affected live flows.

## Acceptance gates

```text
rg "components/shells|shape:\s*[\"']shell[\"']" src
```

must return no production matches.

Additionally:

- the contract registry alone reveals the complete visible structure of modal, drawer and dropdown;
- mechanics files contain no presentation class literals;
- no lint suppression, warning downgrade or compatibility alias is added;
- modal/drawer focus, Escape, dismissal and scroll locking still work;
- dropdown keyboard navigation, disabled items, selection and danger tone still work;
- canonical lint adoption reports strict rules and `ok: true`;
- FE lint, typecheck, tests and production build pass.

## Important evidence already inspected

- `starci-academy-fe/src/components/contracts/index.ts`
- `starci-academy-fe/src/components/contracts/props.ts`
- `starci-academy-fe/src/components/branches/Tree/index.tsx`
- `starci-academy-fe/src/components/shells/{RouteShell,ModalShell,DrawerShell,DropdownShell}`
- `.claude/fe/gates/layouts/gate.schema.json`
- `.claude/fe/gates/layouts/INDEX.md`

The layout gate currently says it returns one `LayoutPlan` while its schema exposes `LayoutPlanSet` with 3–4 candidates. Resolve that schema/document disagreement before treating business-to-JSON generation as deterministic.
