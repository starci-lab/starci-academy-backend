# Overview · Seeded owned apps

## Purpose

The Nivo backend idempotently seeds an Expert Academy app and an MMO app for the fixed demo account so the existing generic owned-instance query can expose both without provisioning MMO infrastructure or inventing MMO product features.

## Included

- Idempotent demo-owned instance seed for tester@nivo.local
- One seeded ai_academy instance labelled Học viện Chuyên gia
- One seeded mmo instance labelled MMO
- Generic myInstances projection for both seeded rows

## Excluded

- MMO provisioning, chart installation, DNS publication or deployment
- MMO catalogue purchase or pricing tiers
- MMO-specific product detail tables, operations or control-center behavior
- Production users other than the fixed demo account

## Source heads

| Role | Repository | Head |
|---|---|---|
| be | https://github.com/starci-lab/nivo-backend.git | `947c6f4a117e1677e37ad98ba03f3dac0bca148e` |
