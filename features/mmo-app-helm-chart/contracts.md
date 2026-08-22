# Contracts · MMO application Helm chart

## Entity · MMO Helm chart package (`mmo-chart-package`)

Fields: `artifact owner and chart reference form`, `chart metadata and optional version`, `values contract`, `workload and service templates`, `validation fixtures`

Evidence: `EV-001`, `EV-003`, `EV-005`

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

- Kind/owner: `command` / `backend`
- Inputs: MMO chart package, representative non-secret values
- Outputs: lint verdict, rendered Kubernetes manifests
- Failures: invalid chart metadata, missing required value, invalid rendered manifest
- Evidence: `EV-001`

No field, failure or operation may appear here without routed source evidence.
