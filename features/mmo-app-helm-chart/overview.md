# Overview · MMO application Helm chart

## Purpose

Nivo gains one MMO-owned Helm chart artifact that the backend can resolve through its generic chart-source contract, while provisioning activation remains separately authorized.

## Included

- One MMO-specific Helm chart artifact consumable through the backend chart-ref and optional chart-version contract.
- A declared chart values and runtime contract sufficient for deterministic Helm lint and template validation.
- Backend chart-source resolution that continues to refuse null, unsupported or missing chart sources before Helm executes.
- Preservation of MMO as non-provisionable until a separate authority approves its runtime pipeline and customer flow.

## Excluded

- Changing the current multi-app-registry authority or its child-pipeline behavior.
- Setting the MMO registry row isProvisionable flag to true.
- Creating catalogue offers, prices, plans, demo-owned instances or frontend availability for MMO.
- Running a deployment, publishing DNS, selecting an MMO management destination or exposing infrastructure fields publicly.
- Guessing MMO workloads, images, commands, ports, probes, identity, secrets, configuration, persistence or tenant resources.

## Source heads

| Role | Repository | Head |
|---|---|---|
| be | https://github.com/starci-lab/nivo-backend.git | `947c6f4a117e1677e37ad98ba03f3dac0bca148e` |
