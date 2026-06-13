# question
<!-- @starci/seperator -->
Millions of people refresh the product/landing page in the seconds before launch. Your origin can't serve that, yet the buy endpoint must be strongly consistent about stock. How do you split the page so most of it is served from the CDN while the buy path stays correct?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
middle
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
CDN
## 1
<!-- @starci/seperator -->
Caching
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — Separate the static shell from the dynamic truth. The landing page — images, copy, layout, even the countdown logic — is identical for everyone, so render it as a static asset and push it to the CDN with a long TTL so millions of page loads are served entirely at the edge and never reach your origin. The only dynamic bits are "is it live yet" and "how many left", which you fetch with a tiny separate request that can be cached for a second or served from a fast in-memory layer, and which is explicitly approximate. The actual buy/checkout endpoint is never cached: it goes through admission control to the inventory service and does the atomic decrement, so correctness lives only on that thin, protected path while everything cacheable is offloaded.
:::

:::muted
**Trade-off** — Caching the page and the stock indicator trades freshness for survivability: the displayed "items left" may lag reality by a second or be intentionally coarse ("almost gone"), which is fine because the buy endpoint, not the page, is the source of truth. You accept that some users click buy on a page that already shows stock that is actually gone, and you handle that gracefully at checkout rather than trying to keep the page perfectly live. Pushing the countdown to the client (client-side timer synced to a server time) trades a small clock-skew risk for removing a synchronized wave of "is it live yet" polls against the origin.
:::

:::muted
**Pitfall & Failure mode** — The classic mistake is rendering the stock count into the cached HTML, which either makes the page uncacheable or freezes a stale number for everyone for the whole TTL. Another is letting the "how many left" endpoint be uncached and hammered by every client polling each second, which recreates the origin overload you tried to avoid — cache it briefly and add jitter or push updates. A subtle failure is cache stampede on the static page at T-zero if its TTL expires right at launch, so pre-warm the CDN and stagger expiries. Finally, never let the buy endpoint share a cache with anything: a misconfigured CDN rule that caches a checkout response can serve one user's confirmation or a stale sold-out to thousands, corrupting the sale.
:::
<!-- @starci/seperator -->
