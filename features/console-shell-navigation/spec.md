# Shared console shell navigation

> Business head: `fa00110a15a1c5fe40ae5131fec40f0e6010a9b927753a12367beadf599271be`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Every authenticated console route shares one desktop navigation rail with expanded and compact presentations, while narrow screens use one right-edge drawer with the same destination identities.

Included:
- Shared console chrome for Overview, Apps, AgentOS and Wallet routes
- Desktop rail expanded and compact presentations
- Visible keyboard-operable collapse and expand control
- Persisted collapse preference and adjacent body reflow
- Circular icon-only compact destinations with accessible labels
- Pinned controls with destination-group internal scrolling
- Right-edge mobile navigation drawer with the complete destination set

Excluded:
- Continuously resizable navigation width
- Standalone routes for unavailable Servers, Domains or Support destinations
- Backend API or data ownership changes

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/nivo-fe.git | `223c252250b935ff2ac8803c5747b9b842d9b4da` |

## 3. Actors and access

### Authenticated account owner

- Navigate every available console destination and choose a persistent compact or expanded desktop rail

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 4. Entry points and surfaces

### Console navigation

- ID: `console-shell`
- Route: `/:locale/(overview|apps|agentos|wallet)`
- Purpose: Keep navigation identity, state and interaction stable while routed console content changes.
- Regions: `desktop-console-navigation`, `mobile-console-navigation`
- Navigation: Overview (available), Apps (available), AgentOS (available), Servers (unavailable), Domains (unavailable), Wallet (available), Support (unavailable)

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 5. Business flows

### Navigate the shared console shell

Trigger: Open any authenticated console route

1. **account-owner** — Read the expanded destination rail and activate the visible collapse control → The same rail host becomes compact and the routed body reflows
2. **account-owner** — Traverse circular icon destinations or activate the expand control → Navigation remains operable and the expanded rail is restored
3. **account-owner** — Open and close the right-edge drawer on a narrow viewport → The complete destination set remains reachable without a bottom tab bar

Outcomes:
- The account owner keeps one stable way to navigate across every console route and viewport

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 6. Business rules

### BR-01

The destination collection preserves one selected key, keyboard traversal, focus-visible feedback and the same destination order on every console route.

Strength: **confirmed** · Evidence: `EV-002`, `EV-003`, `EV-005`, `EV-006`

### BR-02

The desktop rail has exactly two persisted presentations: expanded at 256px and collapsed at 64px, toggled by one visible keyboard-operable control while the adjacent body reflows.

Strength: **confirmed** · Evidence: `EV-006`

### BR-03

Collapsed destinations keep stable circular glyphs, accessible labels and target size; visible copy may disappear but destination meaning may not.

Strength: **confirmed** · Evidence: `EV-006`

### BR-04

Collapse control and Overview remain pinned while only long destination groups own internal scrolling.

Strength: **confirmed** · Evidence: `EV-006`

### BR-05

Below the desktop breakpoint the standing rail and bottom tab bar are absent; one right-edge drawer exposes the complete destination set.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`, `EV-004`, `EV-005`, `EV-006`

## 7. State model

- **Expanded desktop rail** (`expanded`, initial) → collapsed — `EV-001`, `EV-002`, `EV-006`
- **Compact desktop rail** (`collapsed`, success) → expanded — `EV-006`
- **Mobile drawer closed** (`mobile-closed`, initial) → mobile-open — `EV-001`, `EV-004`, `EV-005`, `EV-006`
- **Mobile drawer open** (`mobile-open`, success) → mobile-closed — `EV-004`, `EV-005`, `EV-006`

## 8. Entities and data

- **Console navigation preference**: collapsed state, selected destination, viewport presentation — `EV-002`, `EV-003`, `EV-006`

## 9. Operations and APIs

No operation is confirmed.

## 10. Acceptance conditions

- **AC-01** Every authenticated console route renders the same expanded or collapsed desktop rail state without remounting its host. — `EV-001`, `EV-002`, `EV-006`
- **AC-02** A visible keyboard-operable toggle changes the desktop rail between 256px and 64px, persists the choice and reflows the routed body. — `EV-006`
- **AC-03** Compact mode retains circular icon targets, accessible labels, selected state and destination order. — `EV-003`, `EV-006`
- **AC-04** Only destination groups scroll; toggle and Overview remain pinned. — `EV-006`
- **AC-05** A narrow viewport exposes all destinations in a right-edge drawer and renders neither desktop rail nor bottom tab bar. — `EV-001`, `EV-004`, `EV-005`, `EV-006`

## 11. Explicit unknowns

No unresolved question is recorded.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `apps/app/src/app/[locale]/(console)/layout.tsx:55` | route | The authenticated route-group layout mounts one strict StarCi theme boundary, desktop topbar, collapsible desktop rail, mobile navigation owner and routed main body. |
| EV-002 | fe | `apps/app/src/components/layouts/ConsoleNav/index.tsx:76` | ui | Console navigation owns the complete grouped destination set, selected route, expanded and compact ListBox presentations, persisted collapsible rail and mobile right-edge drawer. |
| EV-003 | fe | `packages/ui/src/leaves/SelectionList/index.tsx:10` | ui | SelectionList preserves one HeroUI ListBox owner while expanded labels and compact circular icon targets share selected, focus and keyboard behavior; the first destination group stays pinned. |
| EV-004 | fe | `packages/ui/src/branches/DrawerBranch/index.tsx:6` | ui | DrawerBranch owns right-edge placement, backdrop, focus, dismissal and the single drawer body. |
| EV-005 | fe | `apps/app/src/components/layouts/ConsoleNav/index.spec.tsx:19` | test | Interaction tests prove seven destinations, disabled routes, compact icon presentation, collapse control, the complete mobile drawer and locale-aware activation. |
| EV-006 | fe | `packages/ui/src/branches/CollapsibleRail/index.tsx:7` | ui | CollapsibleRail owns one stable desktop motion host, persisted 256px and 64px states, reduced-motion behavior, invariant inset, accessible toggle and safe storage fallback. |
