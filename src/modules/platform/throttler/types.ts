export * from "./types/request-response"

/** A single named-window override for `@Throttle` (ttl + request limit). */
export interface ThrottleWindowOptions {
    /** Window length in milliseconds. */
    ttl: number
    /** Max requests allowed per tracker within the window. */
    limit: number
}

/**
 * `@Throttle(...)` option object keyed by the module window names
 * (`short` / `long`); each value overrides that window for the endpoint.
 */
export type ThrottleTierOptions = Record<string, ThrottleWindowOptions>
