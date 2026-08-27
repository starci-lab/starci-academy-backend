/** Input for renewing an authoritative execution lease. */
export interface HeartbeatExecutionInput {
    executionId: string
    claimantKey: string
    commandKey: string
    expectedVersion: string
    leaseToken: string
    leaseDurationMs: number
}
