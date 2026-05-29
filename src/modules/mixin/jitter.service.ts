import {
    Injectable
} from "@nestjs/common"
import {
    JitterOptions,
} from "./types"

/**
 * Service for adding random jitter to delays (e.g. to avoid thundering herd).
 */
@Injectable()
export class JitterService {
    /**
     * Returns baseDelay + random jitter.
     * By default uses full jitter: result in [baseDelayMs, baseDelayMs * 2].
     *
     * @param baseDelayMs - Base delay in milliseconds.
     * @param options.factor - Jitter factor (default 1). Result in [baseDelayMs, baseDelayMs * (1 + factor)].
     * @returns Delay in milliseconds with jitter.
     */
    addJitter(
        baseDelayMs: number, 
        options?: JitterOptions
    ): number {
        const factor = options?.factor ?? 1
        const jitter = Math.random() * factor * baseDelayMs
        return Math.round(jitter)
    }

    /**
     * Sleep for baseDelayMs with random jitter, then resolve.
     *
     * @param baseDelayMs - Base delay in milliseconds.
     * @param options - Optional jitter options.
     */
    async delayWithJitter(
        baseDelayMs: number,
        options?: JitterOptions,
    ): Promise<void> {
        const delayMs = this.addJitter(
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
