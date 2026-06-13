# question
<!-- @starci/seperator -->
Your team is launching a flash sale: 1,000 units of a phone go on sale at exactly 12:00, and marketing expects two million people to hit the page in the first minute. Why is this fundamentally harder than normal e-commerce traffic, and what is the core tension you must design around?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
junior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Flash Sale
## 1
<!-- @starci/seperator -->
Fundamentals
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — The defining property is a synchronized spike: instead of demand spread across the day, nearly all traffic arrives in a few seconds, driven by a known countdown. Normal capacity planning assumes a smooth curve, but here the peak can be hundreds of times the average, so you must design for the burst, not the mean. The second property is scarcity: two million people compete for 1,000 units, meaning 99.95% of requests are doomed to fail to buy, yet every one of them still costs CPU, database connections, and bandwidth. The core tension is that you must accept and shed almost all of this traffic cheaply while still being perfectly correct about the tiny pool of inventory.
:::

:::muted
**Trade-off** — You trade fairness and richness of experience for survivability. A "first-come-first-served at the millisecond" guarantee is nearly impossible at this scale, so most systems accept approximate fairness (queueing, randomized admission) in exchange for not collapsing. You also push as much work as possible to the edge (CDN, static pages, client-side countdown) and keep only the truly stateful operation — decrementing inventory — on a small, carefully protected hot path. The cost is added complexity and a less "real-time" feel for users who are placed in a waiting room.
:::

:::muted
**Pitfall & Failure mode** — The classic failure is treating a flash sale like ordinary peak traffic and simply autoscaling the web tier; the stateless tier scales fine, but the request all funnel into one inventory row and one product cache key, and that single hot point melts. Another failure is letting losing traffic reach the database at all — two million reads against one row will saturate connections and starve the few requests that could actually succeed. Teams also forget the thundering herd at T-zero, where every client polls or fires at the same instant; without jitter, admission control, or a queue, the spike is even sharper than the raw user count suggests.
:::
<!-- @starci/seperator -->
