# Acceptance · Wallet, SePay top-up and billing management

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | Wallet balance, transactions and invoices render as complete independent surfaces whose loading, empty, answered and refused states retain the same anatomy and recovery ownership. | `EV-001`, `EV-002`, `EV-011` |
| `AC-02` | A positive VND amount can create a SePay wallet-top-up pay link and submit its signed fields to the returned external checkout endpoint. | `EV-004`, `EV-005`, `EV-006`, `EV-011` |
| `AC-03` | The UI claims top-up success only after refreshed wallet or transaction evidence confirms the provider-settled credit; cancellation or an unresolved return never claims success. | `EV-003`, `EV-007`, `EV-008`, `EV-010`, `EV-011` |
| `AC-04` | Transaction and invoice management preserves real identities, statuses, dates, notes, amounts and actions at production-like density without fabricated totals. | `EV-001`, `EV-002`, `EV-003`, `EV-008`, `EV-009`, `EV-011` |
| `AC-05` | An owned unpaid invoice can be paid from wallet balance, after which every ledger refreshes and linked provisioning starts. | `EV-001`, `EV-002`, `EV-009` |
| `AC-06` | Every desktop, collapsed-navigation, mobile and overlay state uses the one grammar-locked StarCi visual theme. | `EV-011` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
