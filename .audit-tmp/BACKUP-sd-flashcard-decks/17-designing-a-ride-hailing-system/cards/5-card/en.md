# question
<!-- @starci/seperator -->
A trip moves through requested → accepted → driver-arrived → in-progress → completed. Halfway through the ride the rider's phone loses signal for two minutes. Design the trip state machine so the trip survives app/network drops and both sides end up consistent.
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
middle
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
StateMachine
## 1
<!-- @starci/seperator -->
Reliability
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — Model the trip as an explicit server-side state machine where the backend is the single source of truth and only legal transitions are allowed (e.g. you can only go in-progress from accepted/arrived, completed from in-progress). Each transition is an idempotent, authenticated command (`startTrip`, `completeTrip`) carrying the trip ID and a client-generated request key, persisted durably with the new state and a monotonically increasing version. Clients are thin views that render whatever state the server reports; on reconnect, a phone re-fetches the current trip state and resumes from there, while the driver's app — which still has signal — keeps the trip progressing. The fare meter and trip progress are driven by the driver's location stream and server clock, not the rider's connection, so a rider dropping offline does not pause or corrupt the trip.
:::

:::muted
**Trade-off** — Making the server authoritative and every transition idempotent costs extra storage and a round trip per state change, but it is what lets either party reconnect safely; a "trust the client's local state" design is simpler and snappier offline yet diverges the moment a packet is lost. Persisting each transition synchronously gives durability and a clean audit trail at the cost of write latency on the hot path, whereas buffering events is faster but risks losing a state change on crash. You also balance how aggressively to auto-complete or auto-cancel on prolonged disconnects — eager timeouts free resources but can wrongly end a live trip; lenient ones avoid that but leave zombie trips occupying a driver.
:::

:::muted
**Pitfall & Failure mode** — The core danger is split-brain state: rider's app says "completed," driver's says "in-progress," because each tracked state locally instead of reconciling with the server. Non-idempotent transitions cause double-charges or double-completions when a flaky network makes the client retry `completeTrip`; the request key must dedupe replays. Allowing illegal jumps (completing a trip that was never accepted) corrupts billing, so transitions must be validated against current state with optimistic concurrency to reject stale writes. Finally, tying trip progress or the fare meter to the rider's heartbeat means a signal drop wrongly stalls the meter or cancels an in-progress ride — progress must follow the driver and server, with reconnect simply re-syncing the rider's view.
:::
<!-- @starci/seperator -->
