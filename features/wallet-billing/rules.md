# Business rules · Wallet, SePay top-up and billing management

## BR-01

A first wallet read creates a real zero-balance wallet; zero is an answered value, not an absent wallet.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-002`

## BR-02

A SePay top-up accepts a positive VND amount, records a pending wallet-top-up payment and returns a reference, checkout endpoint and signed checkout fields before any wallet credit is claimed.

- Strength: `confirmed`
- Evidence: `EV-004`, `EV-005`, `EV-006`

## BR-03

Wallet credit occurs only after the authenticated SePay webhook retrieves a paid provider order and routes the matching wallet-top-up settlement.

- Strength: `confirmed`
- Evidence: `EV-007`, `EV-010`

## BR-04

Wallet transactions are viewer-scoped and returned newest first with deposit or spend direction, amount, optional note and creation time.

- Strength: `confirmed`
- Evidence: `EV-003`, `EV-008`

## BR-05

Invoice settlement is restricted to an owned unpaid invoice and starts provisioning for its linked service after payment.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-009`

## BR-06

Wallet, top-up, transaction and invoice states form one StarCi-themed payment journey on desktop and mobile; a project-local visual theme is not permitted.

- Strength: `confirmed`
- Evidence: `EV-011`

## BR-07

After checkout return, the frontend refreshes wallet and transaction facts and must not label the payment successful, failed or expired without an authoritative contract result.

- Strength: `partial`
- Evidence: `EV-002`, `EV-003`, `EV-011`
