# Loyalty — findings

Cleanest of the four money domains: pure computation, no persisted state, no security surface of its own (every caller passes a server-resolved userId), and loyalty-discount.service.spec.ts already exercises every branch. One minor finding.

## 1. [jsdoc] resolveLoyaltyPercent has no defensive note/type on a negative extraOwnedCount
Computes enrolledCount = ownedCount + extraOwnedCount with no floor/guard. Every current caller passes a non-negative value (cart-line index) so not reachable today, but neither JSDoc nor the type (plain number) states the precondition. A future negative caller would silently under-discount.
- src/modules/bussiness/loyalty/loyalty-discount.service.ts:130-155 · types/index.ts:44-53
