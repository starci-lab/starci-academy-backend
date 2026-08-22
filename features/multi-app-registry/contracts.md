# Contracts · Multi-app provisioning registry

## Entity · Provisionable application (`provisionable-app`)

Fields: `key`, `name`, `instance label`, `chart ref`, `chart version`, `host base domain`, `identity mode`, `auth host prefix`, `pipeline steps`, `step config`, `secret specs`, `config builder key`, `default plan code`, `is provisionable`

Evidence: `EV-001`, `EV-002`

## Entity · Application child policy (`app-child-policy`)

Fields: `ordered step keys`, `per-step parameters`, `secret requirements`, `config builder strategy`, `identity strategy`

Evidence: `EV-001`, `EV-002`

## Operation · resolveApp

- Kind/owner: `query` / `backend`
- Inputs: application key
- Outputs: provisionable app registry row
- Failures: application key absent or unregistered
- Evidence: `EV-003`

## Operation · resolveForExpertSite

- Kind/owner: `query` / `backend`
- Inputs: instance-linked site identity
- Outputs: Helm chart ref, optional version and app key
- Failures: registry row absent, chart ref absent, local chart directory absent
- Evidence: `EV-004`, `EV-006`

## Operation · createInstance

- Kind/owner: `command` / `backend`
- Inputs: catalogue order, resolved app row, resolved plan
- Outputs: instance bound to the app registry row
- Failures: app not provisionable, instance label absent, host base domain absent
- Evidence: `EV-003`, `EV-005`

No field, failure or operation may appear here without routed source evidence.
