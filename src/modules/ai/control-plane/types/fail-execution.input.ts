/** Input for failing an execution. */
export interface FailExecutionInput {
    executionId: string
    claimantKey: string
    terminalKey: string
    expectedVersion: string
    leaseToken: string
    errorCode: string
}
