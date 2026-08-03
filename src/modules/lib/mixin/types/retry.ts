import type {
    Options
} from "p-retry"

/** Params for retrying an action. */
export interface RetryParams<T> {
    /** The action to invoke; retried on failure until it succeeds or retries are exhausted. */
    action: () => Promise<T> | T
    /** Optional p-retry options controlling retry count, backoff, and timeouts. */
    options?: RetryOptions
}

/** Retry options (p-retry). */
export type RetryOptions = Options
