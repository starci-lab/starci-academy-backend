/**
 * Options for adding jitter to a delay.
 */
export interface JitterOptions {
    /**
     * Fraction of the delay to use as max jitter (0–1). Default 1 (full jitter).
     * E.g. 0.5 => result in [delay * 0.5, delay * 1.5].
     */
    factor?: number
}
