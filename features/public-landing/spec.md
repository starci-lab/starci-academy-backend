# Public nivo landing

> Business head: `b0da977340dc52c1d141196104615d7dd75fcfef1e48a2002c5c446feddd5e64`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

The root landing route presents the nivo brand and a concise product description without requesting session or backend data.

Included:
- Public root route
- Brand mark, title and description

Excluded:
- Authentication or console actions
- Backend operations

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/nivo-fe.git | `97eec8c5bb4c8f4b9e4bb7c59ea771ed829841d9` |

## 3. Actors and access

### Public visitor

- Recognize the nivo product at the root address

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

## 4. Entry points and surfaces

### nivo

- ID: `public-landing`
- Route: `/`
- Purpose: Introduce the product before any account or service journey begins.
- Regions: `brand-introduction`
- Navigation: nivo (active)

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

## 5. Business flows

### Public nivo landing

Trigger: Open the root route

1. **account-actor** — Open the root route → Read the nivo identity and product description
2. **account-actor** — Read the nivo identity and product description → The visitor receives a stable public brand landing surface

Outcomes:
- The visitor receives a stable public brand landing surface

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

## 6. Business rules

### BR-01

The landing page makes no request and contains no authenticated behavior.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

## 7. State model

- **ready** (`ready`, initial) → terminal — `EV-001`, `EV-002`, `EV-003`, `EV-004`

## 8. Entities and data

- **Brand message**: brand name, description — `EV-001`, `EV-002`, `EV-003`, `EV-004`

## 9. Operations and APIs

No operation is confirmed.

## 10. Acceptance conditions

- **AC-01** The visitor receives a stable public brand landing surface — `EV-001`, `EV-002`, `EV-003`, `EV-004`
- **AC-02** The Public nivo landing surface renders only the states, identities and actions proven by current routed source. — `EV-001`, `EV-002`, `EV-003`, `EV-004`

## 11. Explicit unknowns

- **What public next action should the landing page offer?** — The implemented screen contains identity and description only, so no authentication or product CTA can be claimed.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `apps/landing/src/app/page.tsx:4` | route | The root route mounts the public LandingPage. |
| EV-002 | fe | `apps/landing/src/components/pages/LandingPage/index.tsx:4` | ui | The landing surface renders the brand mark, nivo heading and shared description and explicitly makes no request. |
| EV-003 | fe | `apps/landing/src/resources/copy.ts:1` | ui | The landing description is shipped as product copy. |
| EV-004 | fe | `apps/landing/src/resources/copy.spec.ts:1` | test | The copy test protects the shipped public description. |
