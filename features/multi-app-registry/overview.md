# Overview · Multi-app provisioning registry

## Purpose

The Nivo control plane models each installable application as a registry row with its own Helm chart reference, identity policy, ordered child pipeline, step configuration, secret specification, config-builder strategy, default plan and provisioning availability.

## Included

- Stable data-backed application identities
- Per-app Helm chart reference and optional chart version
- Per-app identity, host, pipeline, step config, secret, config builder and default plan policies
- Generic instance creation and chart resolution from the registry
- Per-row provisioning availability

## Excluded

- Helm chart contents
- Marketing copy, catalogue pricing and tenant-specific values
- Public GraphQL enumeration of infrastructure registry data
- Assuming every registered app is provisionable

## Source heads

| Role | Repository | Head |
|---|---|---|
| be | https://github.com/starci-lab/nivo-backend.git | `947c6f4a117e1677e37ad98ba03f3dac0bca148e` |
