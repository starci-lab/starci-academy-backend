# Contracts · Seeded owned apps

## Entity · Owned application instance (`owned-instance`)

Fields: `owner`, `app registry identity`, `customer-facing name`, `hostname`, `resource allocation`, `status`, `chart and image version snapshot`

Evidence: `EV-002`, `EV-003`, `EV-005`

## Operation · seedDemoOwnedApps

- Kind/owner: `command` / `backend`
- Inputs: fixed demo account, ai_academy registry row, mmo registry row
- Outputs: idempotently persisted academy and MMO instances
- Failures: demo account absent, required registry identity absent, database write refusal
- Evidence: `EV-001`, `EV-002`, `EV-005`

## Operation · myInstances

- Kind/owner: `query` / `backend`
- Inputs: authenticated viewer
- Outputs: owned app key, instance identity, name, plan, resources and status
- Failures: authentication rejected, instance registry identity missing
- Evidence: `EV-003`, `EV-004`

No field, failure or operation may appear here without routed source evidence.
