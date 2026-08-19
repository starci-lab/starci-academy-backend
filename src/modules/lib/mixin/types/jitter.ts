/**
 * Options for adding jitter to a delay.
 */
export interface JitterOptions {
    /**
     * Multiplier applied to the base delay to get the max jitter magnitude
     * (default 1). The jitter added is a random value in
     * `[0, baseDelayMs * factor]` -- e.g. `factor: 0.5` on a 1000ms base
     * yields jitter in `[0, 500]`.
     */
    factor?: number
}

/**
 * Internal brand symbol for {@link DelayMilliseconds}. Never exported, never
 * read or written at runtime -- its only job is to give the branded type a
 * structural identity distinct from a plain `number` (and from any other
 * branded number type in this codebase), so the two only unify on purpose.
 */
declare const delayMillisecondsBrand: unique symbol

/**
 * A wait duration in milliseconds, derived from `Math.random()`-based jitter.
 * At runtime this is just a `number` -- the brand is a compile-time-only
 * fence.
 *
 * INVARIANT -- this value MUST NOT become, or feed into, an identifier, a
 * one-time code, a nonce, a token, a filename, a cache key, or anything else
 * whose *unpredictability* matters. It exists to schedule a `setTimeout` or
 * an HTTP retry wait, and nothing else. `Math.random()` is fine for spreading
 * out retries; it is not fine as an entropy source for the uses above (V8's
 * xorshift128+ state is recoverable from a handful of consecutive outputs) --
 * reach for `crypto.randomBytes` / `crypto.randomUUID` for those instead.
 *
 * The brand does not make misuse impossible -- a determined caller can still
 * write `delay as unknown as SomeId`. What it removes is the *silent* path:
 * a `DelayMilliseconds` cannot flow into a position typed as an id, a token,
 * or any other domain type without that cast being written out in plain
 * sight, where review and grep both catch it.
 *
 * Only {@link JitterService} and the axios retry-delay helper construct this
 * type (`... as DelayMilliseconds`, right next to the `Math.random()` call
 * that earns it). Everywhere else, treat it as opaque -- consume it as a
 * `number` (it is one), never re-derive one by casting a plain number.
 */
export type DelayMilliseconds = number & { readonly [delayMillisecondsBrand]: "DelayMilliseconds" }
