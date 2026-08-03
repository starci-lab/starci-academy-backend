/** Params for wait (poll until condition or max attempts). */
export interface WaitParams {
    /** Predicate polled each attempt; resolving true stops the wait successfully. */
    action: () => Promise<boolean> | boolean
    /** Maximum number of polling attempts before giving up. */
    maxAttempts?: number
    /** Delay in milliseconds between polling attempts. */
    intervalMs?: number
    /** When true, throws if the condition is never met within maxAttempts. */
    throwOnFail?: boolean
}
