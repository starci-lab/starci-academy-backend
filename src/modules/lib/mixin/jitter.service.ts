import {
    Injectable
} from "@nestjs/common"
import {
    DelayMilliseconds,
    JitterOptions,
} from "./types/jitter"

@Injectable()
/**
 * Service for sleeping with random jitter (e.g. to avoid thundering herd on
 * retries). {@link delayWithJitter} is the ONLY public entry point on
 * purpose: it awaits the wait and resolves to nothing, so no caller ever
 * receives the underlying random number back out.
 *
 * The jitter magnitude itself is computed by a private (`#`) method -- a real
 * JavaScript private, not just a TypeScript `private` (which is erased at
 * compile time and still callable via a cast). `#jitteredDelay` is
 * unreachable from outside this class at runtime, so there is no raw
 * millisecond value for a caller to repurpose as an id, a nonce, a filename,
 * or a one-time code. If a future need genuinely requires the bare number
 * (e.g. logging the chosen delay), that is a deliberate, visible widening of
 * this class's surface -- not something to reach for quietly.
 */
export class JitterService {
    /**
     * Computes a random jitter amount, uniformly distributed in
     * `[0, baseDelayMs * factor]`. Branded {@link DelayMilliseconds} because
     * this number is a wait duration and MUST NOT be treated as anything
     * else -- see the invariant documented on that type.
     *
     * @param baseDelayMs - Base delay in milliseconds.
     * @param options.factor - Jitter factor (default 1): max jitter is `baseDelayMs * factor`.
     * @returns Jitter amount in milliseconds, branded as a delay-only value.
     */
    #jitteredDelay(
        baseDelayMs: number,
        options?: JitterOptions
    ): DelayMilliseconds {
        const factor = options?.factor ?? 1
        const jitter = Math.random() * factor * baseDelayMs
        return Math.round(jitter) as DelayMilliseconds
    }

    /**
     * Sleep for baseDelayMs plus random jitter, then resolve. This is the
     * only way to use jitter from outside this class -- it returns `void`,
     * never the millisecond value, so there is nothing here for a caller to
     * launder into a different kind of value.
     *
     * @param baseDelayMs - Base delay in milliseconds.
     * @param options - Optional jitter options.
     */
    async delayWithJitter(
        baseDelayMs: number,
        options?: JitterOptions,
    ): Promise<void> {
        const delayMs = this.#jitteredDelay(
            baseDelayMs,
            options)
        return new Promise(
            (resolve) => setTimeout(
                resolve,
                delayMs
            )
        )
    }
}
