/** Input for claiming an accepted execution. */
export interface ClaimExecutionInput {
    executionId: string
    claimantKey: string
    commandKey: string
    expectedVersion: string
    leaseDurationMs: number
}
