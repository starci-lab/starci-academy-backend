# Business rules · MMO application Helm chart

## BR-01

MMO owns one distinct Helm chart artifact at charts/mmo in starci-lab/nivo-charts and the backend consumes it only through the registry chart-ref and optional chart-version contract.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-004`, `EV-005`, `EV-006`, `EV-007`

## BR-02

A null, unsupported or missing MMO chart source is refused before Helm executes or provisioning secrets are minted.

- Strength: `confirmed`
- Evidence: `EV-004`

## BR-03

Adding the chart artifact does not by itself make MMO provisionable, define its pipeline or expose a frontend action.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-002`

## BR-04

The generic chart requires image repository, image tag and service port, exposes configurable ingress, persistence and probes, and never borrows Academy runtime values as MMO defaults.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-002`, `EV-006`

## BR-05

The chart package must pass deterministic Helm lint and template validation before its reference can be treated as usable.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-008`
