/** Input for cancelling an execution as its actor or an administrator. */
export interface CancelExecutionInput {
    executionId: string
    actorKey: string
    terminalKey: string
    expectedVersion: string
    isAdmin: boolean
    reasonCode: string
}
