# States · Course marketplace and checkout

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `marketplace-ready` | initial | Marketplace ready | checkout-pending | `EV-001`, `EV-002`, `EV-004`, `EV-005` |
| `checkout-pending` | pending | Checkout pending | checkout-started, marketplace-error | `EV-006`, `EV-007` |
| `checkout-started` | success | Checkout started | terminal | `EV-007` |
| `marketplace-error` | error | Marketplace or checkout failed | marketplace-ready | `EV-004`, `EV-005`, `EV-006` |
