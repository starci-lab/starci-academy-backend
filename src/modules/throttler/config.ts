import {
    ThrottlerOptions
} from "@nestjs/throttler"
import {
    ThrottlerConfig
} from "./enums"
import {
    ThrottleTierOptions,
    ThrottleWindowOptions
} from "./types"

/** Name of the short (per-minute) throttler window. */
const SHORT_WINDOW = "short"

/** Name of the long (per-hour) throttler window. */
const LONG_WINDOW = "long"

/** Short window length in milliseconds (1 minute). */
const SHORT_TTL_MS = 60_000

/** Long window length in milliseconds (1 hour). */
const LONG_TTL_MS = 60 * 60_000

/**
 * No-op default limit for the module-level throttlers. It is intentionally
 * huge so that endpoints WITHOUT an explicit `@Throttle(...)` are effectively
 * unlimited — there is NO global rate cap; every limit is opt-in per endpoint.
 */
const NOOP_LIMIT = 1_000_000

/**
 * Per-tier request limits, keyed by window. Reused as the source of truth for
 * the `@Throttle` option presets below (short = 1 minute, long = 1 hour).
 */
export const throttlerConfig: Record<ThrottlerConfig, Array<ThrottleWindowOptions>> = {
    [ThrottlerConfig.Soft]: [
        // 1 minute — loose limit
        {
            ttl: SHORT_TTL_MS,
            limit: 100,
        },
        // 1 hour — long-term total cap
        {
            ttl: LONG_TTL_MS,
            limit: 1000,
        },
    ],

    [ThrottlerConfig.Medium]: [
        // 1 minute
        {
            ttl: SHORT_TTL_MS,
            limit: 30,
        },
        // 1 hour
        {
            ttl: LONG_TTL_MS,
            limit: 300,
        },
    ],

    [ThrottlerConfig.Strict]: [
        // 1 minute — very strict
        {
            ttl: SHORT_TTL_MS,
            limit: 10,
        },
        // 1 hour — strict long-term cap
        {
            ttl: LONG_TTL_MS,
            limit: 100,
        },
    ],
}

/**
 * The named throttler windows registered at the module level. They carry a
 * no-op default limit (see {@link NOOP_LIMIT}) so they impose NO global cap;
 * each endpoint overrides them per-window via `@Throttle({ short, long })`.
 *
 * @returns The named module throttler windows (short + long).
 */
export const getModuleThrottlers = (): Array<ThrottlerOptions> => [
    // per-minute window — overridden per endpoint, no-op otherwise
    {
        name: SHORT_WINDOW,
        ttl: SHORT_TTL_MS,
        limit: NOOP_LIMIT,
    },
    // per-hour window — overridden per endpoint, no-op otherwise
    {
        name: LONG_WINDOW,
        ttl: LONG_TTL_MS,
        limit: NOOP_LIMIT,
    },
]

/**
 * Builds the `@Throttle(...)` option object for a tier, keyed by the module
 * window names so it overrides them for the decorated endpoint.
 *
 * @param tier - The preset tier (soft / medium / strict).
 * @returns The per-window override options for `@Throttle`.
 */
const buildTierThrottle = (tier: ThrottlerConfig): ThrottleTierOptions => ({
    // short window override (1 minute)
    [SHORT_WINDOW]: {
        ttl: throttlerConfig[tier][0].ttl,
        limit: throttlerConfig[tier][0].limit,
    },
    // long window override (1 hour)
    [LONG_WINDOW]: {
        ttl: throttlerConfig[tier][1].ttl,
        limit: throttlerConfig[tier][1].limit,
    },
})

/** Loose preset — pass to `@Throttle(SoftThrottle)` on read-heavy endpoints. */
export const SoftThrottle: ThrottleTierOptions = buildTierThrottle(ThrottlerConfig.Soft)

/** Medium preset — pass to `@Throttle(MediumThrottle)` on normal mutations. */
export const MediumThrottle: ThrottleTierOptions = buildTierThrottle(ThrottlerConfig.Medium)

/** Strict preset — pass to `@Throttle(StrictThrottle)` on auth / sensitive endpoints. */
export const StrictThrottle: ThrottleTierOptions = buildTierThrottle(ThrottlerConfig.Strict)
