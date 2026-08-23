# Surface · Provisioning

> ID: `template-app-provisioning` · Route: `/[locale]/apps/new/[templateKey] | /[locale]/apps/[siteId]/provisioning`

## Job

Create or resume one exact template-app provisioning flow.

## Navigation

- none

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `provisioning-progress` | flow | Request; Create app; Build infrastructure; Manage | catalog-loading, request, submitting, accepted, preparing, ready, failed, unsupported | Create app, Back to Apps, Manage apps | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
