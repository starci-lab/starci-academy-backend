# Flow · Request, pay, provision and enter the exact workspace

> ID: `agentos-primary-journey` · Trigger: The authenticated owner requests an AgentOS plan

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `account-owner` | `agentos-order` | Choose an AgentOS plan and create the order | The owner continues on the exact order route |
| 2 | `account-owner` | `wallet-waypoint` | Open Wallet for the invoice linked to that exact order | Wallet becomes a waypoint without replacing the AgentOS journey |
| 3 | `account-owner` | `wallet-waypoint` | Settle the linked invoice from wallet balance | The owner resumes the same exact order and fulfillment can advance |
| 4 | `account-owner` | `agentos-order` | Observe accepted and preparing states on the exact order | The ready workspace identity is resolved |
| 5 | `account-owner` | `agentos-workspace` | Open the exact ready workspace | The exact workspace control center is the primary terminal |

## Outcomes

- The owner lands in the exact owned workspace that fulfilled the paid order
- Wallet is a correlated payment waypoint rather than the journey terminal

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-010`, `EV-014`, `EV-015`
