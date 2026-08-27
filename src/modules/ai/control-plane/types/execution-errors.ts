/** Stable error codes returned by the Slice 00 control plane. */
export enum AiExecutionErrorCode {
    /** Hide or report an execution that cannot be loaded. */
    NotFound = "not_found",
    /** Reject access by an actor that does not own the execution. */
    Forbidden = "forbidden",
    /** Reject admission while the runtime switch is dark or inconsistent. */
    NotAccepting = "not_accepting",
    /** Reject reuse of an idempotency key for different request bytes. */
    IdempotencyConflict = "AI_EXECUTION_IDEMPOTENCY_MISMATCH",
    /** Reject a transition that is invalid for the durable state. */
    StateConflict = "state_conflict",
    /** Reject a stale optimistic version. */
    VersionConflict = "version_conflict",
    /** Reject a claimant or token that lacks current lease authority. */
    LeaseConflict = "lease_conflict",
    /** Reject work after the authoritative lease expires. */
    LeaseExpired = "lease_expired",
    /** Reject work after the execution deadline expires. */
    DeadlineExpired = "deadline_expired",
    /** Reject values outside the frozen Slice 00 input contract. */
    InvalidInput = "invalid_input",
    /** Tell the caller to retry after bounded serialization recovery is exhausted. */
    RetryableConflict = "retryable_conflict",
}

/** Typed control-plane failure with no transport coupling. */
export interface AiExecutionError {
    code: AiExecutionErrorCode
    message: string
}
