import {
    DelayMilliseconds,
} from "@modules/lib/mixin/types/jitter"
import Decimal from "decimal.js"

/** Parameters for {@link computeRetryDelayWithJitter}. */
export interface ComputeRetryDelayWithJitterParams {
    /** 0-based attempt number supplied by axios-retry (`retryCount`). */
    retryCount: number
    /** Base delay in milliseconds the exponential backoff is scaled from. */
    baseDelayMs: number
    /** Max magnitude in milliseconds of the random jitter added on top. */
    jitterMaxMs: number
}

/**
 * Exponential backoff (`baseDelayMs * 2^retryCount`) plus random jitter in
 * `[0, jitterMaxMs)`, as a pure function so the formula is unit-testable in
 * isolation from axios-retry's callback wiring.
 *
 * Returns a branded {@link DelayMilliseconds} -- this is a wait duration and
 * MUST NOT be treated as anything else (see the invariant documented on that
 * type). This is the ONLY place in this module that reads `Math.random()`;
 * if you need a similar backoff elsewhere, call this function rather than
 * copying its body -- copying the two lines that read `Math.random()` is
 * exactly the mistake this type exists to catch.
 *
 * @param params - See {@link ComputeRetryDelayWithJitterParams}.
 * @returns Total retry delay in milliseconds, branded as a delay-only value.
 */
export const computeRetryDelayWithJitter = ({
    retryCount,
    baseDelayMs,
    jitterMaxMs,
}: ComputeRetryDelayWithJitterParams): DelayMilliseconds => {
    // exponential backoff: 2^retryCount * baseDelayMs
    const backoff = new Decimal(2).pow(new Decimal(retryCount)).mul(baseDelayMs)
    // random jitter in [0, jitterMaxMs) to prevent thundering herd
    const jitter = new Decimal(Math.random()).mul(jitterMaxMs)
    return backoff.add(jitter).toNumber() as DelayMilliseconds
}
