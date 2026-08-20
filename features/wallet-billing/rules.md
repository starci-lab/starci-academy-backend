# Business rules · Wallet and invoice settlement

## BR-01

A first wallet read creates a real wallet row, so zero balance is an answer rather than an absent state.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## BR-02

Invoice payment is restricted to an unpaid invoice owned by the viewer and starts provisioning for the linked service.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
