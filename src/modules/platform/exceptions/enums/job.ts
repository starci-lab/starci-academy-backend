/** Reason why open position job cannot be enqueued. */
export enum CannotOpenPositionEnqueueJobReason {
    /** A matching open-position job is already queued -- enqueue again would duplicate work. */
    AlreadyInQueue = "alreadyInQueue",
    /** Enqueue itself threw; treat as infra failure, not a business rejection. */
    RuntimeError = "runtimeError",
}

/** Reason why reconcile balance job cannot be enqueued. */
export enum CannotReconcileBalanceEnqueueJobReason {
    /** A matching reconcile job is already queued -- enqueue again would duplicate work. */
    AlreadyInQueue = "alreadyInQueue",
    /** Enqueue itself threw; treat as infra failure, not a business rejection. */
    RuntimeError = "runtimeError",
}

/** Reason why close position job cannot be enqueued. */
export enum CannotClosePositionEnqueueJobReason {
    /** Position cannot be settled yet -- closing would leave an inconsistent ledger. */
    CannotSettlePosition = "cannotSettlePosition",
    /** A matching close-position job is already queued -- enqueue again would duplicate work. */
    AlreadyInQueue = "alreadyInQueue",
    /** Enqueue itself threw; treat as infra failure, not a business rejection. */
    RuntimeError = "runtimeError",
}
