# Overview · Wallet, SePay top-up and billing management

## Purpose

An authenticated account owner reviews the wallet, starts a real SePay top-up, returns to reconcile the credited balance and transaction ledger, and manages wallet transactions and service invoices from one coherent payment flow.

## Included

- Wallet balance with correct independent surface states
- SePay wallet top-up amount entry and signed external checkout handoff
- Return, cancellation and reconciliation states after checkout
- Wallet transaction history with direction, amount, note and date
- Invoice history, invoice detail and settlement from wallet balance
- Desktop and mobile payment flow under the strict StarCi visual grammar

## Excluded

- Frontend or backend source implementation in this business-analysis run
- An in-app SePay QR payload that the current API does not return
- Fabricated payment status, expiry or ledger totals absent from the current contract
- Changing or removing the backend's existing PayOS capability

## Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/nivo-fe.git | `3102d35bfa73e51c52d087352c68ee106b4a5a46` |
| be | https://github.com/starci-lab/nivo-backend.git | `947c6f4a117e1677e37ad98ba03f3dac0bca148e` |
