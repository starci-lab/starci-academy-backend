# question
<!-- @starci/seperator -->
During a downpour, demand in a neighborhood spikes far past available drivers. Design surge pricing: how do you compute the demand/supply imbalance per area, and how do you make sure the multiplier a rider was quoted is the price they actually pay?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
middle
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
SurgePricing
## 1
<!-- @starci/seperator -->
Consistency
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — Divide the city into pricing zones (often the same geo-cells used for indexing) and, on a short rolling window, count open ride requests versus available drivers per zone. A pricing service turns that ratio into a surge multiplier via a tuned function with smoothing, and publishes the current multiplier per zone to a fast cache. When a rider requests a quote, the system reads the zone's current multiplier, computes the fare, and — critically — freezes that quote: it stores the multiplier and price against the trip (or a signed, time-boxed quote token) so that even if surge changes a second later, the rider is charged the number they accepted. Drivers see a heat map of surging zones to nudge supply toward demand.
:::

:::muted
**Trade-off** — Smaller zones and shorter windows make surge responsive and locally accurate but jittery — multipliers flicker, riders feel gamed, and tiny samples are noisy; larger zones and longer windows are stable but lag real conditions and blur hotspots. Recomputing surge very frequently is precise but costly and can cause price oscillation; smoothing and rate-limiting changes trade immediacy for a calmer experience. Freezing the quote is great for rider trust but means your charged price can diverge from live market conditions during the quote's validity window, so that window must be short.
:::

:::muted
**Pitfall & Failure mode** — The headline bug is quoting one multiplier and charging another because pricing is read again at charge time instead of being pinned to the trip — this destroys trust and invites disputes. Other failures: feedback oscillation where surge raises price, demand drops, surge falls, demand returns, and the multiplier swings wildly without damping; zone-edge unfairness where two riders 50 m apart on opposite sides of a boundary pay very different prices; and stale supply counts that over-surge because drivers who just went offline still appear available. Surge data is also business-sensitive, so leaking or mispublishing multipliers (or letting clients compute their own) is both a correctness and an integrity risk.
:::
<!-- @starci/seperator -->
