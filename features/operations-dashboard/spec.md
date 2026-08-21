# Operations dashboard

> Business head: `cecf53f7f29811d83a18c70a8c064abe3387037114da1f9efedb9fc08d86a991`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

The authenticated console overview independently summarizes owned apps, AgentOS workspaces, infrastructure context, domains and account wallet state, preserving partial answers when another section is refused.

Included:
- Protected console navigation
- Apps, AgentOS, combined infrastructure/domain evidence and wallet overview regions
- Independent loading, empty, answered and refused states
- Responsive console navigation with a standing desktop rail and one mobile drawer opening from the right edge

Excluded:
- Standalone Servers, Domains or Support destinations
- Invented totals for list responses

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/nivo-fe.git | `3102d35bfa73e51c52d087352c68ee106b4a5a46` |
| be | https://github.com/starci-lab/nivo-backend.git | `947c6f4a117e1677e37ad98ba03f3dac0bca148e` |

## 3. Actors and access

### Authenticated account owner

- Review the operational state of services and open Apps, AgentOS or Wallet management

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

## 4. Entry points and surfaces

### Overview

- ID: `operations-overview`
- Route: `/[locale]/overview`
- Purpose: Scan the account's current service and money state from one protected page.
- Regions: `apps-summary`, `agentos-summary`, `infrastructure-summary`, `wallet-summary`
- Navigation: Overview (active)

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

## 5. Business flows

### Operations dashboard

Trigger: Open the protected overview

1. **account-actor** — Open the protected overview → Read independently settled service summaries
2. **account-actor** — Read independently settled service summaries → Follow an available management destination
3. **account-actor** — Follow an available management destination → The owner sees every answer that succeeded even when another query is refused

Outcomes:
- The owner sees every answer that succeeded even when another query is refused

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

## 6. Business rules

### BR-01

Each overview section settles independently; one refusal does not turn the whole dashboard into an error.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

### BR-02

List responses without a declared total are represented by members and navigation, not an invented count.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

### BR-03

Below the desktop breakpoint, console destinations live in one right-edge drawer opened by a visible menu control; the standing rail and bottom tab bar are absent.

Strength: **confirmed** · Evidence: `EV-003`, `EV-006`

## 7. State model

- **resting** (`resting`, initial) → empty — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`
- **empty** (`empty`, empty) → answered — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`
- **answered** (`answered`, success) → refused — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`
- **refused** (`refused`, error) → terminal — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

## 8. Entities and data

- **Operations snapshot**: expert sites, AgentOS workspaces, pod reachability, domains, wallet balance, unpaid invoice — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

## 9. Operations and APIs

- **myExpertSites** (query, backend) — input: none; output: owned expert sites; failures: transport or API refusal — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`
- **myAgentWorkspace** (query, backend) — input: none; output: owned AgentOS workspace; failures: not found or refusal — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`
- **myDomains** (query, backend) — input: none; output: owned domains; failures: transport or API refusal — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`
- **myWallet** (query, backend) — input: none; output: wallet balance; failures: transport or API refusal — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

## 10. Acceptance conditions

- **AC-01** The owner sees every answer that succeeded even when another query is refused — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`
- **AC-02** The Operations dashboard surface renders only the states, identities and actions proven by current routed source. — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`
- **AC-03** The mobile overview exposes all available console destinations through a keyboard-operable right-side drawer without covering the page when closed. — `EV-003`, `EV-006`

## 11. Explicit unknowns

- **When will Servers, Domains and Support have standalone routes?** — They are visible in navigation, but current destinations are deliberately unavailable.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `apps/app/src/components/pages/OverviewPage/component.tsx:94` | ui | The overview draws four independently settled summary blocks for Apps, AgentOS, combined infrastructure/domain evidence and Wallet. |
| EV-002 | fe | `apps/app/src/components/pages/OverviewPage/index.tsx:69` | ui | The connected overview independently queries apps, AgentOS, domains and wallet/invoice data, maps pending, empty, populated, partial and failed states, and routes to available destinations. |
| EV-003 | fe | `apps/app/src/components/layouts/ConsoleNav/index.tsx:77` | route | Console navigation exposes the complete grouped destination set through one controlled HeroUI ListBox on desktop and the same set inside a right-edge mobile drawer. |
| EV-004 | be | `src/features/core/api/core/graphql/queries/expert-sites/my-expert-sites/my-expert-sites.resolver.ts:38` | api | myExpertSites is an authenticated viewer-owned query ordered newest first. |
| EV-005 | be | `src/features/core/api/core/graphql/queries/wallet/my-wallet/my-wallet.handler.spec.ts:8` | test | The wallet handler test proves an owner-scoped wallet is created/read for the requesting user. |
| EV-006 | owner | `decision:5c3005db18db6b470c0b84a97865aa8bd99eeb92c225d40e64fd3436faaa6e4e` | owner-decision | The owner requested a production-quality Nivo dashboard using the current product visual language and explicitly selected a mobile navigation drawer that opens from the right edge. |
