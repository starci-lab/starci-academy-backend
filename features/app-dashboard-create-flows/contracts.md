# Contracts · Separated app dashboards and create flows

## Entity · Pre-persistence create context (`create-context`)

Fields: `productFamily`, `optional templateKey`, `no persisted resource identifier`

Evidence: `EV-001`, `EV-006`

## Entity · Persisted AgentOS order reference (`agentos-order-reference`)

Fields: `orderId`

Evidence: `EV-001`, `EV-003`

## Entity · Persisted Template App site reference (`template-site-reference`)

Fields: `siteId`

Evidence: `EV-001`, `EV-008`, `EV-009`, `EV-010`

## Operation · Open AgentOS create route

- Kind/owner: `redirect` / `frontend`
- Inputs: locale
- Outputs: /:locale/agentos/create
- Failures: Create route cannot be resolved
- Evidence: `EV-001`, `EV-002`

## Operation · Continue persisted AgentOS order

- Kind/owner: `redirect` / `frontend`
- Inputs: locale, orderId
- Outputs: /:locale/agentos/orders/:orderId
- Failures: Order persistence is refused, Persisted order identity is unavailable
- Evidence: `EV-001`, `EV-003`

## Operation · Open selected Template App create route

- Kind/owner: `redirect` / `frontend`
- Inputs: locale, templateKey
- Outputs: /:locale/apps/create/:templateKey
- Failures: Template is unavailable, Create route cannot be resolved
- Evidence: `EV-001`, `EV-006`, `EV-007`

## Operation · Continue persisted Template App provisioning

- Kind/owner: `redirect` / `frontend`
- Inputs: locale, siteId
- Outputs: /:locale/apps/:siteId/provisioning
- Failures: Site creation or publication is refused, Persisted site identity is unavailable
- Evidence: `EV-001`, `EV-008`, `EV-009`

No field, failure or operation may appear here without routed source evidence.
