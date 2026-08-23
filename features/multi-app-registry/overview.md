# Overview · Multi-app provisioning registry

## Purpose

The Nivo control plane models each installable application as a registry row with its own Helm chart reference, identity policy, ordered child pipeline, step configuration, secret specification, config-builder strategy, default plan and provisioning availability. The authenticated Apps console will consume a safe owned-instance projection and present Học viện Chuyên gia and MMO as two current apps with distinct black-red SVG identity marks.

## Included

- Stable data-backed application identities
- Per-app Helm chart reference and optional chart version
- Per-app identity, host, pipeline, step config, secret, config builder and default plan policies
- Generic instance creation and chart resolution from the registry
- Per-row provisioning availability
- Idempotent demo seed of Học viện Chuyên gia and MMO for the fixed local owner
- Safe owned-instance projection consumed by the Apps console
- Detailed responsive Apps flow with one black-red SVG identity mark per app

## Excluded

- Helm chart contents
- Marketing copy, catalogue pricing and tenant-specific values
- Public GraphQL enumeration of infrastructure registry data
- Assuming every registered app is provisionable
- Public exposure of chart refs, pipeline steps, secret specs or step config
- MMO provisioning before its chart and child policy become complete
- MMO-specific management operations not established by product authority

## Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/nivo-fe.git | `269c99b0cf974ee476bda48f916c3a5ad3cdd3bf` |
| be | https://github.com/starci-lab/nivo-backend.git | `947c6f4a117e1677e37ad98ba03f3dac0bca148e` |
