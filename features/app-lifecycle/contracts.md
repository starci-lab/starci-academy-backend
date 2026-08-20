# Contracts · Template app lifecycle

## Entity · Expert site (`entity-1`)

Fields: `id`, `slug`, `provisionStatus`, `publicHost`, `template identity`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## Entity · Deployment snapshot (`entity-2`)

Fields: `deploymentId`, `status`, `publicHost`, `failure reason`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## Operation · catalogItems

- Kind/owner: `query` / `backend`
- Inputs: site_from_template
- Outputs: template offers and tiers
- Failures: catalogue refusal
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## Operation · createExpertSite

- Kind/owner: `mutation` / `backend`
- Inputs: slug
- Outputs: draft expert site
- Failures: invalid or unavailable slug
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## Operation · myExpertSiteDeployment

- Kind/owner: `query` / `backend`
- Inputs: siteId
- Outputs: latest deployment snapshot
- Failures: site not owned or not found
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

No field, failure or operation may appear here without routed source evidence.
