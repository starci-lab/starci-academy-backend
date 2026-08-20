# Overview · Wallet and invoice settlement

## Purpose

An authenticated account owner reads a real auto-provisioned wallet balance, transaction ledger and invoice ledger, then pays the newest unpaid invoice and refreshes all three views.

## Included

- Wallet balance
- Wallet transaction ledger
- Invoice ledger
- Paying an unpaid invoice and starting linked provisioning

## Excluded

- A wired wallet top-up flow
- Invented ledger totals

## Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/nivo-fe.git | `97eec8c5bb4c8f4b9e4bb7c59ea771ed829841d9` |
| be | https://github.com/starci-lab/nivo-backend.git | `947c6f4a117e1677e37ad98ba03f3dac0bca148e` |
