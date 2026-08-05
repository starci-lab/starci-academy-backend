import {
    envConfig,
} from "@modules/platform/env/config"

/** Cache configuration shape (TTL, debug, stale) from env. */
export type CacheConfig = ReturnType<typeof envConfig>["cache"]
