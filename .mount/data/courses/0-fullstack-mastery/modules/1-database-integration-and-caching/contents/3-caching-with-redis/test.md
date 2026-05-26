# Test Flows — 3-caching-with-redis

Status: AUTHORED (4 flows). E2E verification pending sandbox unblock.

## Flow 1 — Response cache (`GET /cats/response-layer` + `DELETE /cats/response-layer/cache`)

- First call: HTTP 200, body `"This data would be cached..."`, latency ~1000ms (MISS).
- Second call: same body, latency ~1-5ms (HIT).
- `DELETE /cats/response-layer/cache`: `{ "message": "...", "cacheKey": "cats_res_layer" }`.

## Flow 2 — Logic cache (`GET /cats/logic-layer` + `DELETE /cats/logic-layer/cache`)

- First call: `{ "message": "Hải sản cho mèo cực phẩm", "timestamp": "<ISO>" }`, latency ~1000ms (MISS).
- Second call: same body, fast (HIT).
- `DELETE /cats/logic-layer/cache`: `{ "message": "...", "cacheKey": "cats_logic_layer_cache" }`.

## Flow 3 — DB query cache (`POST /cats/seed?count=1000` + `GET /cats/db-layer` + `DELETE /cats/db-layer/cache`)

- Seed: `{ "message": "Seed completed successfully.", "inserted": 1000 }`.
- First GET: array of cats, latency includes SQL (MISS).
- Second GET: same array, faster (HIT -- no SQL emitted).
- `DELETE /cats/db-layer/cache`: `{ "message": "...", "cacheKey": "cats_db_layer_cache" }`.

## Flow 4 — Cascade invalidation (`GET /cats/all-layers/:id` + `DELETE /cats/all-layers/cache`)

- First GET `/cats/all-layers/1`: `{ "responseSample": "...", "logicSample": {...}, "dbCount": 1000 }`, slow (MISS on all 3 layers).
- Second GET: same body, fast (HIT on all 3).
- `DELETE /cats/all-layers/cache`: `{ "message": "All 3 cache layers cleared...", "cleared": { "responseLayer": "cats_res_layer", "logicLayer": "cats_logic_layer_cache", "dbLayer": "cats_db_layer_cache" } }`.
- Re-GET `/cats/all-layers/1`: again slow -- proves cascade clear actually removed all 3 keys.
