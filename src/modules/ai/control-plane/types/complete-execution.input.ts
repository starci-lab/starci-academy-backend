/** Input for completing an execution. */
export interface CompleteExecutionInput {
    executionId: string
    claimantKey: string
    terminalKey: string
    expectedVersion: string
    leaseToken: string
    resultHash: string
}
