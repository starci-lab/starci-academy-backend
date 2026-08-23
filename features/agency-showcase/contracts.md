# Contracts · Agency showcase and lead capture

## Entity · Service offer (`service-offer`)

Fields: `title`, `body`, `included points`

Evidence: `EV-003`

## Entity · Indicative price tier (`price-tier`)

Fields: `name`, `price range`, `time range`, `body`, `included points`

Evidence: `EV-004`

## Entity · Project case (`project-case`)

Fields: `title`, `category`, `highlights`, `stack`, `image`

Evidence: `EV-006`

## Entity · Contact lead (`contact-lead`)

Fields: `name`, `email`, `company`, `service`, `message`, `receivedAt`

Evidence: `EV-007`, `EV-008`

## Operation · POST /api/contact

- Kind/owner: `command` / `frontend`
- Inputs: name, email, optional company, optional service, message
- Outputs: ok
- Failures: invalid fields, delivery webhook not configured, upstream delivery failed
- Evidence: `EV-008`

No field, failure or operation may appear here without routed source evidence.
