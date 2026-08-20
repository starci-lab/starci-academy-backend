# Contracts · Public expert academy

## Entity · Public course (`entity-1`)

Fields: `id`, `slug`, `title`, `summary`, `priceText`, `sortIndex`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## Entity · Lead submission (`entity-2`)

Fields: `name`, `contact`, `optional message`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## Operation · courses

- Kind/owner: `query` / `backend`
- Inputs: none
- Outputs: public ordered course catalogue
- Failures: empty catalogue fallback
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## Operation · submitLead

- Kind/owner: `mutation` / `backend`
- Inputs: name, contact, optional message
- Outputs: lead ID
- Failures: validation or transport refusal
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

No field, failure or operation may appear here without routed source evidence.
