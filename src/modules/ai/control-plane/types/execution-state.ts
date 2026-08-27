/** States in the durable AI execution lifecycle. */
export enum AiExecutionState {
    /** Admit the request for a future worker claim. */
    Accepted = "accepted",
    /** Grant one claimant a fenced, expiring lease. */
    Running = "running",
    /** Close successfully with a canonical result digest. */
    Completed = "completed",
    /** Close unsuccessfully with a stable error code. */
    Failed = "failed",
    /** Close through an owner or administrator cancellation. */
    Cancelled = "cancelled",
}

/** Operation recorded for the currently authoritative lease command. */
export enum AiLeaseCommandOperation {
    /** Create the first lease and disclose its token to the winner once. */
    Claim = "claim",
    /** Extend the current lease without replacing its authority token. */
    Heartbeat = "heartbeat",
}

/** Terminal writer that closed an execution. */
export enum AiExecutionTerminalKind {
    /** Persist a successful result digest. */
    Complete = "complete",
    /** Persist a worker-reported failure code. */
    Fail = "fail",
    /** Fence an execution at an owner or administrator request. */
    Cancel = "cancel",
    /** Fence an execution whose deadline or lease expired. */
    Reconcile = "reconcile",
}

/** The only capability enabled by Slice 00. */
export enum AiExecutionCapability {
    /** Exercise only the internal Slice 00 control-plane path. */
    ControlPlaneProbe = "control_plane_probe",
}
