# question
<!-- @starci/seperator -->
Two riders request a ride at the same instant and the same driver is the best candidate for both. Walk through your matching/dispatch design so that exactly one rider gets that driver, no driver is ever double-assigned, and you still favor good matches (nearest vs ETA-optimal).
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
senior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Matching
## 1
<!-- @starci/seperator -->
Concurrency
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — Generate a candidate set from the geo-index, then rank by predicted ETA over the road network rather than crow-flies distance, since a closer driver behind traffic or a river is worse. To prevent double-assignment, dispatch must claim the driver atomically: before offering, the matcher acquires a short-lived lock or does a conditional state transition (e.g. Redis `SET driver:{id}:lock req {token} NX EX 15`, or a single-partition actor/queue per driver) so only one request can hold a driver at a time. The locked driver gets an exclusive offer with a timeout; on accept, the lock converts into an assignment, and on decline/timeout the lock is released and the matcher moves to the next candidate. Routing all requests for a given driver through one serialized owner (an actor keyed by driverId, or a per-driver Redis key) makes "offered to exactly one rider" a hard invariant.
:::

:::muted
**Trade-off** — Nearest-by-distance is cheap and simple but produces worse pickups; ETA-optimal needs live traffic and routing calls, costing latency and money per match, so many systems use distance for the candidate cut and ETA only to rank the short list. Locking a driver while an offer is outstanding guarantees no double-booking but temporarily removes that driver from other riders' candidate pools, which can slightly hurt global match efficiency — a tighter lock TTL improves throughput but risks releasing a driver who was about to accept. There is also a batch-vs-greedy choice: batching requests over a short window and solving an assignment problem yields globally better pairings than first-come greedy dispatch, at the cost of added wait.
:::

:::muted
**Pitfall & Failure mode** — Without an atomic claim, a classic race lets both requests read the driver as "available" and both send an offer, so the driver sees two pings or gets assigned two trips. Lock TTLs that are too long strand a driver as "busy" after a crashed dispatcher (you need expiry plus a heartbeat to release), while TTLs too short let the offer expire mid-accept and double-dispatch anyway. Other failures: not handling the driver-side decline/no-response path leads to stuck requests; offering to a driver whose location has gone stale assigns someone who already left the area; and ignoring fairness/anti-starvation can repeatedly skip a request that never wins the greedy pass.
:::
<!-- @starci/seperator -->
