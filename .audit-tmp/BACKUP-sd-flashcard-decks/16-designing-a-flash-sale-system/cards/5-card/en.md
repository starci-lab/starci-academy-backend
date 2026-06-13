# question
<!-- @starci/seperator -->
A user wins a unit and moves to payment, but payment takes 30 seconds to a few minutes and many winners abandon it. Design the reservation-and-payment flow: how do you hold stock during payment, time it out, and release unpaid reservations back to the pool?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
middle
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Reservation
## 1
<!-- @starci/seperator -->
Payment
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — Model stock in two phases: a reservation that holds a unit while payment is pending, and a confirmation that converts the reservation into a sold order. When a user wins, atomically decrement available stock and create a reservation with an expiry (for example two minutes) — this is the same atomic decrement that prevents oversell, just tagged as "held". On successful payment you confirm the reservation; if payment fails or the timer expires, you release the unit by incrementing available stock back and marking the reservation expired so someone else can buy it. A background sweeper (a scheduled job or a Redis key TTL with keyspace notifications, or a delay queue) handles expiry so abandoned reservations do not permanently lock inventory.
:::

:::muted
**Trade-off** — Reserve-then-confirm trades effective availability for a good buyer experience: while units are held in pending payment, they are unavailable to others even though some of those payments will never complete, so a short timeout maximizes throughput but risks cutting off slow-but-genuine payers, while a long timeout strands inventory and can make a not-actually-sold-out sale look sold out. You also choose between releasing eagerly the instant a timer fires versus a periodic sweep — eager release recovers inventory fastest but is more complex and chatty, while a sweep is simpler but adds latency before stock returns. Holding state in Redis with TTL is fast and self-expiring but needs reconciliation with the durable order record.
:::

:::muted
**Pitfall & Failure mode** — The dangerous race is between expiry and a late payment success: if the sweeper releases a reservation at the same moment the payment webhook confirms it, you can either oversell (released to someone else and also confirmed) or lose a paid order. Guard the confirm with a conditional update that only succeeds if the reservation is still in the held state, and make release equally conditional, so the two cannot both win. Another failure is releasing stock but forgetting to also invalidate the user's checkout session, letting them pay for a unit they no longer hold. Finally, if release increments raw stock without idempotency, a retried or double-fired expiry can over-credit the counter and reintroduce oversell from the other direction.
:::
<!-- @starci/seperator -->
