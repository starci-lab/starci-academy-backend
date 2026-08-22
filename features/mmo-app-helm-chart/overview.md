# Overview · MMO application Helm chart

## Purpose

Nivo gains one generic MMO Helm chart at charts/mmo in the dedicated nivo-charts repository, while backend provisioning activation remains separately authorized.

## Included

- One MMO-specific Helm chart at charts/mmo in starci-lab/nivo-charts, consumable through the backend chart-ref and optional chart-version contract.
- A generic values contract requiring image repository, image tag and service port while allowing ingress, persistence and probes to be configured.
- A Helm v2 application package with workload, service and optional ingress and persistence templates sufficient for deterministic lint and template validation.
- Backend chart-source resolution that continues to refuse null, unsupported or missing chart sources before Helm executes.
- Preservation of MMO as non-provisionable until a separate authority approves its runtime pipeline and customer flow.

## Excluded

- Changing the current multi-app-registry authority or its child-pipeline behavior.
- Setting the MMO registry row isProvisionable flag to true.
- Creating catalogue offers, prices, plans, demo-owned instances or frontend availability for MMO.
- Running a deployment, publishing DNS, selecting an MMO management destination or exposing infrastructure fields publicly.
- Supplying concrete MMO images, commands, credentials, tenant domains or resource policy that the owner has not declared.

## Source heads

| Role | Repository | Head |
|---|---|---|
| be | https://github.com/starci-lab/nivo-backend.git | `947c6f4a117e1677e37ad98ba03f3dac0bca148e` |
| chart | https://github.com/starci-lab/nivo-charts.git | `4a3aabb9d4db60f0f9e7332195b46276368b5295` |
