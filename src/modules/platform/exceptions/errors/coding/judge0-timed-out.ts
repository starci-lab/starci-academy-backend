import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a Judge0 batch that did not finish within the poll budget. */
export interface Judge0TimedOutExceptionMetadata extends AbstractExceptionMetadata {
    /** Number of poll attempts made before giving up. */
    attempts: number
    /** Number of submissions still not in a terminal state. */
    pendingCount: number
}

/**
 * Thrown when a Judge0 batch is still executing after the configured maximum
 * number of poll attempts -- i.e. the judge did not return terminal results in
 * time. Distinct from a per-testcase Time-Limit-Exceeded verdict.
 */
export class Judge0TimedOutException extends AbstractException {
    constructor({
        attempts,
        pendingCount,
        originalError,
    }: Judge0TimedOutExceptionMetadata) {
        super(
            `Judge0 batch did not complete after ${attempts} poll attempts (${pendingCount} still pending).`,
            "JUDGE0_TIMED_OUT_EXCEPTION",
            {
                attempts,
                pendingCount,
                originalError,
            },
        )
    }
}
