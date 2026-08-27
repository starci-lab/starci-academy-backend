import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata attached to a rejected mock-interview lifecycle transition. */
export interface MockInterviewSessionConflictExceptionMetadata extends AbstractExceptionMetadata {
    /** Stable machine-readable reason for the rejected transition. */
    reason: string
    /** Session involved, when it was found. */
    sessionId?: string
    /** Current durable state, when available. */
    status?: string
    /** Current optimistic revision, when available. */
    revision?: number
}

/** Identifies an invalid or stale transition in the durable practice-session state machine. */
export class MockInterviewSessionConflictException extends AbstractException {
    constructor({
        reason,
        sessionId,
        status,
        revision,
        originalError,
    }: MockInterviewSessionConflictExceptionMetadata) {
        super(
            "Mock interview session state changed; refresh the session before continuing.",
            "MOCK_INTERVIEW_SESSION_CONFLICT_EXCEPTION",
            {
                reason,
                sessionId,
                status,
                revision,
                originalError,
            },
        )
    }
}
