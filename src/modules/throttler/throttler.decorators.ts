import {
    Throttle
} from "@nestjs/throttler"
import {
    ThrottlerConfig
} from "./enums"
import {
    SoftThrottle,
    MediumThrottle,
    StrictThrottle
} from "./config"
import {
    ThrottleTierOptions
} from "./types"

/**
 * Maps each preset tier to its `@Throttle` option object. The options are
 * keyed by the SAME window names registered at the module level
 * (`short` / `long`) so the guard actually applies them — the previous
 * uuid-keyed implementation never matched a module window and was a no-op.
 */
const tierOptions: Record<ThrottlerConfig, ThrottleTierOptions> = {
    // loose preset for read-heavy endpoints
    [ThrottlerConfig.Soft]: SoftThrottle,
    // medium preset for normal mutations
    [ThrottlerConfig.Medium]: MediumThrottle,
    // strict preset for auth / sensitive endpoints
    [ThrottlerConfig.Strict]: StrictThrottle,
}

/**
 * Applies a preset rate-limit tier to an endpoint. Works because a global
 * {@link ThrottlerBehindProxyGuard} (APP_GUARD) is the enforcement engine and
 * the module registers matching `short` / `long` windows (with a no-op default
 * so undecorated endpoints stay unlimited — there is no global cap).
 *
 * @param config - The preset tier (soft / medium / strict).
 * @returns The `@Throttle` decorator pre-filled with the tier's per-window limits.
 *
 * @example
 * \@UseThrottler(ThrottlerConfig.Strict)
 * \@Mutation(() => SignInResponse)
 */
export const UseThrottler = (config: ThrottlerConfig) => {
    // resolve the preset's per-window limits and hand them to @Throttle
    return Throttle(tierOptions[config])
}
