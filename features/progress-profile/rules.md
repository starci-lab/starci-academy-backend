# Business rules · Progress, profile and league

## BR-01

The dashboard is authenticated and keeps overview blocks independently settling rather than treating the whole page as one request.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-002`

## BR-02

Profile updates are partial: omitted keys remain unchanged, explicit null clears nullable fields, strings are trimmed where declared, and the refreshed row is returned.

- Strength: `confirmed`
- Evidence: `EV-007`

## BR-03

A daily quest reward can be claimed only after completion and only once per day in one atomic grant.

- Strength: `confirmed`
- Evidence: `EV-008`

## BR-04

The league surface supports weekly and global scopes and preserves the viewer's own standing alongside ranked identities.

- Strength: `confirmed`
- Evidence: `EV-005`, `EV-006`, `EV-009`
