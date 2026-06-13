# question
<!-- @starci/seperator -->
You need a "drivers within 2 km of this pickup point" query to return in single-digit milliseconds across hundreds of thousands of online drivers. Walk through how a geospatial index (geohash, quadtree, or S2 cells) actually makes that query fast, and what happens at cell boundaries.
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
senior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Geospatial
## 1
<!-- @starci/seperator -->
Indexing
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — All three techniques map 2D coordinates onto a 1D, hierarchical key so that nearby points share a prefix and can be bucketed. A geohash interleaves latitude/longitude bits into a base-32 string where a longer prefix means a smaller cell; S2 projects the globe onto a cube and uses a Hilbert curve to produce 64-bit cell IDs at 30 levels; a quadtree recursively splits space into four quadrants, refining only where driver density is high. At query time you compute the cell(s) covering the search radius, then read just those buckets (often Redis `GEOSEARCH` / sorted sets, or in-memory grids keyed by cell), so you scan a few hundred candidate drivers instead of the whole fleet, and finish with an exact distance filter to drop false positives.
:::

:::muted
**Trade-off** — Cell size is the central knob: large cells mean fewer buckets to read but each bucket holds many irrelevant drivers you must distance-filter, while small cells give tight candidate sets but a single radius now spans many cells, raising fan-out and re-indexing churn as drivers cross boundaries. Geohash is simple and string-prefix friendly but has rectangular cells that distort near the poles and at boundary seams; S2 has near-uniform cell area and excellent neighbor math but is heavier to implement; quadtrees adapt to density (great for dense downtowns) but rebalancing and pointer-chasing add complexity. Most production systems pick S2 or geohash with a fixed level tuned per city density.
:::

:::muted
**Pitfall & Failure mode** — The classic bug is the boundary problem: a driver 50 m away can sit in an adjacent cell, so querying only the rider's home cell silently misses the closest drivers. You must expand to the cell's 8 neighbors (or all cells the circular radius touches) and then apply the true haversine/road distance — skipping the exact filter returns drivers in the corner of a cell who are actually outside the radius. Other failure modes include hotspots where one cell (an airport, a stadium) holds tens of thousands of drivers and becomes a scan and lock bottleneck, and treating the geohash prefix as exact distance, which it is not — prefix length only bounds cell size, not point-to-point distance.
:::
<!-- @starci/seperator -->
