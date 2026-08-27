import {
    AiExecutionCapability,
    AiExecutionState,
    AiExecutionTerminalKind,
} from "./execution-state"

/** Strongly consistent read model returned by the control plane. */
export interface AiExecutionView {
    id: string
    actorUserId: string | null
    actorKey: string
    capability: AiExecutionCapability
    contractVersion: string
    incarnationId: string
    generation: number
    version: string
    state: AiExecutionState
    claimantKey: string | null
    leaseExpiresAt: Date | null
    deadlineAt: Date
    resultHash: string | null
    errorCode: string | null
    terminalKind: AiExecutionTerminalKind | null
    acceptedAt: Date
    startedAt: Date | null
    terminalAt: Date | null
    createdAt: Date
    updatedAt: Date
}
