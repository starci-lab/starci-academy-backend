import {
    AiExecutionCapability,
} from "./execution-state"

/** Input for accepting one idempotent execution. */
export interface AcceptExecutionInput {
    actorUserId: string | null
    actorKey: string
    capability: AiExecutionCapability
    idempotencyKey: string
    contractVersion: string
    deadlineAt: Date
}
