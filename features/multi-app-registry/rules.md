# Business rules · Multi-app provisioning registry

## BR-01

Each app owns one stable registry key and its own Helm chart argument; filesystem paths and OCI references are supported, while unresolved chart sources are refused before Helm runs.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-004`, `EV-006`

## BR-02

App-specific child behavior is selected through identity mode, ordered pipeline step keys, per-step config, secret specs and config-builder key rather than class inheritance or application conditionals.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-002`

## BR-03

A registered app is not necessarily provisionable; isProvisionable refuses new fulfillment before instance or secret creation while retaining registry truth for existing instances.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-005`

## BR-04

Chart contents, prices, marketing copy and per-tenant values remain owned outside the app registry.

- Strength: `confirmed`
- Evidence: `EV-001`
