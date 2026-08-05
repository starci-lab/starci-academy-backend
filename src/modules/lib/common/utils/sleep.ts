/**
 * Yields the event loop for `ms` (default 1s) so retries back off instead of
 * spinning and immediately re-hitting a rate limit or lock.
 */
export const sleep = async (ms: number = 1000) => {
    return new Promise((resolve) => setTimeout(resolve,
        ms))
}
