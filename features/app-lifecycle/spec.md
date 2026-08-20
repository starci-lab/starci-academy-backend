# Template app lifecycle

> Business head: `2045cdf4a9b8b09eea639d599b6db17a1ee2b825491584c551296c0d3d5162fc`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

An authenticated owner browses template offers beside owned apps, starts the supported academy template, and follows its isolated provisioning snapshot through request, build, ready or failed states into its control center.

Included:
- Owned app fleet
- Template catalogue
- Academy template creation
- Provisioning progress and recovery
- Owned app management entry

Excluded:
- Provisioning catalogue templates not wired by the frontend
- Manual infrastructure operations outside published mutations

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/nivo-fe.git | `97eec8c5bb4c8f4b9e4bb7c59ea771ed829841d9` |
| be | https://github.com/starci-lab/nivo-backend.git | `947c6f4a117e1677e37ad98ba03f3dac0bca148e` |

## 3. Actors and access

### Authenticated app owner

- Build an academy template app and monitor it until it can be managed

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 4. Entry points and surfaces

### Apps

- ID: `apps-catalogue`
- Route: `/[locale]/apps`
- Purpose: Review owned apps and start another from the template catalogue.
- Regions: `owned-apps`, `template-catalogue`
- Navigation: Apps (active), Provisioning (available)

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

### Provisioning

- ID: `template-app-provisioning`
- Route: `/[locale]/apps/new/[templateKey] | /[locale]/apps/[siteId]/provisioning`
- Purpose: Create or resume one exact template-app provisioning flow.
- Regions: `provisioning-progress`
- Navigation: none

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 5. Business flows

### Template app lifecycle

Trigger: Choose Build on a supported template

1. **account-actor** — Choose Build on a supported template → Submit a stable app slug
2. **account-actor** — Submit a stable app slug → Follow deployment progress
3. **account-actor** — Follow deployment progress → Open the ready app control center
4. **account-actor** — Open the ready app control center → A draft expert site and deployment identity are created

Outcomes:
- A draft expert site and deployment identity are created
- A failed or unsupported request is shown explicitly

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 6. Business rules

### BR-01

Owned apps and buyable templates share the same Apps surface but keep distinct lifecycle and price semantics.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

### BR-02

Only the ai_academy template currently exposes a build action; other named templates remain unavailable.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 7. State model

- **catalog-loading** (`catalog-loading`, initial) → request — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **request** (`request`, pending) → submitting — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **submitting** (`submitting`, pending) → accepted — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **accepted** (`accepted`, pending) → preparing — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **preparing** (`preparing`, pending) → ready — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **ready** (`ready`, success) → failed — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **failed** (`failed`, error) → unsupported — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **unsupported** (`unsupported`, pending) → terminal — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 8. Entities and data

- **Expert site**: id, slug, provisionStatus, publicHost, template identity — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **Deployment snapshot**: deploymentId, status, publicHost, failure reason — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 9. Operations and APIs

- **catalogItems** (query, backend) — input: site_from_template; output: template offers and tiers; failures: catalogue refusal — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **createExpertSite** (mutation, backend) — input: slug; output: draft expert site; failures: invalid or unavailable slug — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **myExpertSiteDeployment** (query, backend) — input: siteId; output: latest deployment snapshot; failures: site not owned or not found — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 10. Acceptance conditions

- **AC-01** A draft expert site and deployment identity are created — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **AC-02** The Template app lifecycle surface renders only the states, identities and actions proven by current routed source. — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 11. Explicit unknowns

- **Which catalogue templates beyond ai_academy will receive provisioning flows?** — They may be listed, but the current UI correctly labels them unavailable instead of inventing behavior.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `apps/app/src/components/pages/AppsPage/index.tsx:31` | ui | The Apps page jointly reads owned sites, orders and the site-template catalogue and routes supported offers or owned sites. |
| EV-002 | fe | `apps/app/src/components/pages/AppsPage/component.tsx:19` | ui | Owned apps and template offers are distinct sections with lifecycle, price and action semantics and no invented counts. |
| EV-003 | fe | `apps/app/src/components/blocks/provisioning/TemplateAppProvisioning/index.tsx:17` | ui | The template provisioning controller declares request, accepted, preparing, ready, failed and unsupported phases. |
| EV-004 | be | `src/features/core/api/core/graphql/mutations/expert-sites/create-expert-site/create-expert-site.resolver.ts:42` | api | createExpertSite creates a viewer-owned Draft site from the requested slug. |
| EV-005 | be | `src/features/core/api/core/graphql/mutations/expert-sites/create-expert-site/create-expert-site.handler.spec.ts:8` | test | The create-site handler test proves the viewer identity and requested slug are delegated together. |
| EV-006 | be | `src/features/core/api/core/graphql/queries/expert-sites/my-expert-site-deployment/my-expert-site-deployment.resolver.ts:40` | api | myExpertSiteDeployment returns the latest deployment for one viewer-owned site for status and retry presentation. |
