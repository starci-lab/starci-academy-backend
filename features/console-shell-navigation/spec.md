# Shared console shell navigation

> Business head: `5a56705d6adf4a0c54f40c665768ed91d083c29e598521be84819acb06ec6737`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Every authenticated console route shares one fixed expanded desktop destination rail, while narrow screens use one right-edge drawer with the same destination identities.

Included:
- Shared console chrome for Overview, Apps, AgentOS and Wallet routes
- Fixed expanded desktop navigation rail
- Single-selection keyboard-operable destination collection
- Right-edge mobile navigation drawer with the complete destination set

Excluded:
- Continuously resizable navigation width
- Standalone routes for unavailable Servers, Domains or Support destinations
- Backend API or data ownership changes

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/nivo-fe.git | `3102d35bfa73e51c52d087352c68ee106b4a5a46` |

## 3. Actors and access

### Authenticated account owner

- Navigate every available console destination from the shared desktop rail or mobile drawer

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

## 4. Entry points and surfaces

### Console navigation

- ID: `console-shell`
- Route: `/:locale/(overview|apps|agentos|wallet)`
- Purpose: Keep navigation identity, state and interaction stable while routed console content changes.
- Regions: `desktop-console-navigation`, `mobile-console-navigation`
- Navigation: Overview (available), Apps (available), AgentOS (available), Servers (unavailable), Domains (unavailable), Wallet (available), Support (unavailable)

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

## 5. Business flows

### Navigate the shared console shell

Trigger: Open any authenticated console route

1. **account-owner** — Read the fixed expanded destination rail and choose an available route → The routed body changes while the shared rail remains mounted
2. **account-owner** — Open and close the right-edge drawer on a narrow viewport → The complete destination set remains reachable without a bottom tab bar

Outcomes:
- The account owner keeps one stable way to navigate across every current console route and viewport

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

## 6. Business rules

### BR-01

The destination collection preserves one selected key, keyboard traversal, focus-visible feedback and the same destination order on every console route.

Strength: **confirmed** · Evidence: `EV-002`, `EV-003`, `EV-005`

### BR-05

Below the desktop breakpoint the standing rail and bottom tab bar are absent; one right-edge drawer exposes the complete destination set.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`, `EV-004`, `EV-005`

## 7. State model

- **Expanded desktop rail** (`expanded`, initial) → terminal — `EV-001`, `EV-002`
- **Mobile drawer closed** (`mobile-closed`, initial) → mobile-open — `EV-001`, `EV-004`, `EV-005`
- **Mobile drawer open** (`mobile-open`, success) → mobile-closed — `EV-004`, `EV-005`

## 8. Entities and data

- **Console navigation preference**: selected destination, viewport presentation — `EV-002`, `EV-003`

## 9. Operations and APIs

No operation is confirmed.

## 10. Acceptance conditions

- **AC-01** Every authenticated console route renders the same fixed desktop rail without remounting its host. — `EV-001`, `EV-002`, `EV-003`, `EV-005`
- **AC-05** A narrow viewport exposes all destinations in a right-edge drawer and renders neither desktop rail nor bottom tab bar. — `EV-001`, `EV-004`, `EV-005`

## 11. Explicit unknowns

No unresolved question is recorded.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `apps/app/src/app/[locale]/(console)/layout.tsx:73` | route | The authenticated route-group layout mounts one shared mobile navigation owner, one desktop sidebar owner and one routed main body. |
| EV-002 | fe | `apps/app/src/components/layouts/ConsoleNav/index.tsx:77` | ui | Console navigation owns the complete grouped destination set, selected route, desktop ListBox and mobile right-edge drawer composition. |
| EV-003 | fe | `packages/ui/src/leaves/SelectionList/index.tsx:21` | ui | The shared SelectionList delegates single-selection and keyboard mechanics to HeroUI ListBox. |
| EV-004 | fe | `packages/ui/src/branches/DrawerBranch/index.tsx:6` | ui | The shared DrawerBranch owns right-edge placement, backdrop, focus, dismissal and the single drawer body. |
| EV-005 | fe | `apps/app/src/components/layouts/ConsoleNav/index.spec.tsx:27` | test | Interaction tests prove seven desktop destinations, the complete mobile drawer set, disabled routes and locale-aware activation. |
