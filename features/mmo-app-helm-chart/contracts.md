# Contracts · MMO application Helm chart

## Entity · MMO Helm chart package (`mmo-chart-package`)

Fields: `starci-lab/nivo-charts ownership and charts/mmo path`, `Helm v2 application metadata and optional version`, `required image repository, image tag and service port values`, `configurable ingress, persistence and probes`, `generic workload and service templates`, `validation fixtures`

Evidence: `EV-001`, `EV-003`, `EV-005`, `EV-006`, `EV-007`, `EV-009`

## Entity · MMO registry chart link (`mmo-registry-link`)

Fields: `application key`, `chart reference`, `optional chart version`, `provisioning availability`

Evidence: `EV-002`, `EV-005`

## Operation · resolveMmoChart

- Kind/owner: `query` / `backend`
- Inputs: MMO application registry identity
- Outputs: resolved chart reference, optional chart version, MMO application key
- Failures: missing registry row, null chart reference, unsupported Helm repository reference, missing filesystem chart
- Evidence: `EV-004`, `EV-005`

## Operation · validateMmoChart

- Kind/owner: `command` / `provider`
- Inputs: MMO chart package, representative non-secret values
- Outputs: lint verdict, rendered Kubernetes manifests
- Failures: invalid chart metadata, missing required value, invalid rendered manifest
- Evidence: `EV-001`, `EV-006`, `EV-008`

No field, failure or operation may appear here without routed source evidence.
