import type {
    DataSource,
    QueryRunner,
} from "typeorm"
import type {
    QueryResultCache,
} from "typeorm/cache/QueryResultCache"
import type {
    QueryResultCacheOptions,
} from "typeorm/cache/QueryResultCacheOptions"

/**
 * Process-local, in-memory implementation of TypeORM's {@link QueryResultCache}.
 *
 * Wired into the primary DataSource via `cache.provider` so any query that opts
 * in with `{ cache: { id, milliseconds } }` is served from a plain `Map`
 * instead of the default `query-result-cache` table (database) or Redis.
 *
 * Trade-offs (acceptable for small, hot, rarely-changing catalogs like
 * `ai_models`):
 * - **Per-instance** — each pod keeps its own copy; entries expire by TTL, so
 *   staleness is bounded by the query's `milliseconds`.
 * - **No eviction cap** — fine because the keyspace is a handful of stable
 *   `identifier`s; never cache unbounded user-supplied keys here.
 */
export class InMemoryQueryResultCache implements QueryResultCache {
    /** identifier (or raw query) → last stored cache entry. */
    private readonly store = new Map<string, QueryResultCacheOptions>()

    constructor(
        private readonly dataSource: DataSource,
    ) { }

    /** No external connection — the cache lives in this process's heap. */
    async connect(): Promise<void> {
        // intentionally empty — nothing to connect to
    }

    /** Drop every entry when the DataSource disconnects. */
    async disconnect(): Promise<void> {
        this.store.clear()
    }

    /** No schema to provision for an in-memory map. */
    async synchronize(): Promise<void> {
        // intentionally empty — no backing table
    }

    /**
     * Look an entry up by its `identifier` (preferred) or raw `query` text.
     * @returns the stored entry, or `undefined` on miss.
     */
    async getFromCache(
        options: QueryResultCacheOptions,
    ): Promise<QueryResultCacheOptions | undefined> {
        const key = this.resolveKey(options)
        if (!key) {
            return undefined
        }
        return this.store.get(key)
    }

    /**
     * Persist a freshly executed query result under its key.
     * @param options - the new cache entry (carries `result`, `time`, `duration`).
     */
    async storeInCache(
        options: QueryResultCacheOptions,
    ): Promise<void> {
        const key = this.resolveKey(options)
        if (!key) {
            return
        }
        this.store.set(
            key,
            options,
        )
    }

    /**
     * TTL check used by TypeORM to decide between cache hit and re-query.
     * @returns `true` when `time + duration` is already in the past.
     */
    isExpired(
        savedCache: QueryResultCacheOptions,
    ): boolean {
        const createdAt = savedCache.time ?? 0
        return createdAt + savedCache.duration < Date.now()
    }

    /** Flush the entire cache. */
    async clear(): Promise<void> {
        this.store.clear()
    }

    /**
     * Invalidate specific entries by identifier (e.g. after a catalog reseed).
     * @param identifiers - cache `id`s to drop.
     */
    async remove(
        identifiers: Array<string>,
    ): Promise<void> {
        for (const identifier of identifiers) {
            this.store.delete(identifier)
        }
    }

    /** Prefer the user-set `identifier`; fall back to the raw query text. */
    private resolveKey(
        options: QueryResultCacheOptions,
    ): string | undefined {
        return options.identifier ?? options.query
    }
}
