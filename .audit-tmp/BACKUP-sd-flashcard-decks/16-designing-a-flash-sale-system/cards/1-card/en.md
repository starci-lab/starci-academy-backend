# question
<!-- @starci/seperator -->
During a flash sale your service sold 1,043 units of a 1,000-unit drop. Walk through why a naive "read stock, check > 0, write stock - 1" oversells under concurrency, and design an atomic decrement that makes oversell impossible.
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
senior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Concurrency
## 1
<!-- @starci/seperator -->
Inventory
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Solution** — The naive flow has a read-check-write race: two requests both read stock = 1, both pass the `> 0` check, and both write 0, so two orders are created against one unit. The fix is to make the check and decrement a single atomic operation that the storage engine serializes. In SQL that is a conditional update, `UPDATE inventory SET stock = stock - 1 WHERE id = ? AND stock > 0`, and you treat "rows affected = 0" as sold out — the database row lock guarantees only one writer wins per unit. In Redis the same is done with `DECR` guarded by a Lua script (or `DECRBY` with a check) so the read and write run as one indivisible step, often pre-loading the counter into Redis before the sale to keep the hot path off the database entirely.
:::

:::muted
**Trade-off** — Redis atomic decrement is blazing fast and absorbs the spike, but Redis is then the source of truth for a window of time, so you need a durable reconciliation path (write-behind to the database, AOF/replication) or you risk losing the count on a crash. The SQL conditional update is perfectly durable and simple but serializes on a single hot row, capping you at the lock throughput of that row — fine for thousands per second, not millions. Many designs combine them: Redis gates admission and reserves, the database is the authoritative ledger, and you accept a small eventual-consistency window in exchange for both speed and durability.
:::

:::muted
**Pitfall & Failure mode** — A subtle trap is doing the decrement in application code inside a transaction but using `SELECT` then `UPDATE` without `FOR UPDATE` or a conditional `WHERE`; the optimistic read still races unless the write itself enforces the predicate. Another failure is decrementing first and only later inserting the order, then crashing in between — you have phantom-reserved stock that never converts, so you must pair the decrement with idempotent order creation and a release path. With Redis, forgetting to make the check-and-decrement a single Lua script (issuing `GET` then `DECR` from the client) reintroduces the exact race you were trying to kill, and an unbounded `DECR` can even go negative, silently overselling.
:::
<!-- @starci/seperator -->
