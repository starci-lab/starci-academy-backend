# question
<!-- @starci/seperator -->
A rider opens the app and taps "Request Ride." At a high level, what does the system have to do to put a nearby driver in their car, given that both the rider and dozens of candidate drivers are physically moving the entire time?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
junior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Matching
## 1
<!-- @starci/seperator -->
RealTime
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — The system continuously ingests GPS pings from online drivers and keeps a fresh, queryable view of "who is near where." When a rider requests a trip, the matching service takes the rider's pickup location, runs a spatial "drivers near me" query to get a candidate set, ranks them (usually by ETA, not raw distance), and offers the trip to the best driver. If that driver declines or times out, it offers the next candidate, and so on until someone accepts. The whole loop — request, candidate search, offer, accept — typically needs to resolve within a few seconds so the rider does not stare at a spinner.
:::

:::muted
**Trade-off** — Freshness of driver locations fights with cost: pinging and re-indexing every driver every second gives accurate matches but is enormously expensive at city scale, while slower updates make the candidate set stale so you may dispatch a driver who has already moved away. You also trade match quality against latency — searching a wider radius or computing real road-network ETAs finds a better driver but takes longer, and riders abandon if matching feels slow. The system is fundamentally a moving-target problem, so "good enough, fast" usually beats "optimal, slow."
:::

:::muted
**Pitfall & Failure mode** — A naive design queries a relational table of all drivers with a bounding-box filter on every request; this melts the database under write load from location pings and read load from matching. Another common failure is treating distance as a straight line — the geometrically nearest driver may be across a river or stuck behind a one-way street with a much worse real ETA. Forgetting the decline/timeout path is also fatal: if the first offered driver never responds and there is no fallback, the rider waits forever, so the dispatch loop must move on automatically.
:::
<!-- @starci/seperator -->
