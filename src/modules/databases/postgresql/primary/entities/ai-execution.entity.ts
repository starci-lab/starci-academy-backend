import {
    Column,
    Entity,
    Index,
    PrimaryColumn,
} from "typeorm"
import type {
    AiExecutionCapability,
    AiExecutionState,
    AiExecutionTerminalKind,
    AiLeaseCommandOperation,
} from "@modules/ai/control-plane/types/execution-state"

@Entity({
    schema: "public",
    name: "ai_executions",
})
@Index("uq_ai_executions_accept_identity",
    ["actorKey",
        "capability",
        "idempotencyKey"],
    {
        unique: true,
    })
@Index("ix_ai_executions_state_lease",
    ["state",
        "leaseExpiresAt"])
@Index("ix_ai_executions_state_deadline",
    ["state",
        "deadlineAt"])
@Index("ix_ai_executions_actor_created",
    ["actorKey",
        "createdAt"])
/** Durable state and fencing journal for one Academy AI execution. */
export class AiExecutionEntity {
    @PrimaryColumn("uuid")
        id: string

    @Column({
        name: "actor_user_id",
        type: "uuid",
        nullable: true,
    })
        actorUserId: string | null

    @Column({
        name: "actor_key",
        type: "varchar",
        length: 192,
    })
        actorKey: string

    @Column({
        type: "varchar",
        length: 96,
    })
        capability: AiExecutionCapability

    @Column({
        name: "idempotency_key",
        type: "varchar",
        length: 192,
    })
        idempotencyKey: string

    @Column({
        name: "request_hash",
        type: "char",
        length: 64,
    })
        requestHash: string

    @Column({
        name: "contract_version",
        type: "varchar",
        length: 64,
    })
        contractVersion: string

    @Column({
        name: "incarnation_id",
        type: "uuid",
    })
        incarnationId: string

    @Column({
        type: "integer",
        default: 0,
    })
        generation: number

    @Column({
        type: "bigint",
        default: 1,
    })
        version: string

    @Column({
        type: "varchar",
        length: 16,
    })
        state: AiExecutionState

    @Column({
        name: "claimant_key",
        type: "varchar",
        length: 192,
        nullable: true,
    })
        claimantKey: string | null

    @Column({
        name: "lease_token_hash",
        type: "bytea",
        nullable: true,
    })
        leaseTokenHash: Buffer | null

    @Column({
        name: "lease_expires_at",
        type: "timestamptz",
        nullable: true,
    })
        leaseExpiresAt: Date | null

    @Column({
        name: "lease_command_operation",
        type: "varchar",
        length: 16,
        nullable: true,
    })
        leaseCommandOperation: AiLeaseCommandOperation | null

    @Column({
        name: "lease_command_fence_hash",
        type: "bytea",
        nullable: true,
    })
        leaseCommandFenceHash: Buffer | null

    @Column({
        name: "lease_command_outcome_version",
        type: "bigint",
        nullable: true,
    })
        leaseCommandOutcomeVersion: string | null

    @Column({
        name: "lease_command_outcome_expires_at",
        type: "timestamptz",
        nullable: true,
    })
        leaseCommandOutcomeExpiresAt: Date | null

    @Column({
        name: "deadline_at",
        type: "timestamptz",
    })
        deadlineAt: Date

    @Column({
        name: "result_hash",
        type: "char",
        length: 64,
        nullable: true,
    })
        resultHash: string | null

    @Column({
        name: "error_code",
        type: "varchar",
        length: 96,
        nullable: true,
    })
        errorCode: string | null

    @Column({
        name: "terminal_kind",
        type: "varchar",
        length: 16,
        nullable: true,
    })
        terminalKind: AiExecutionTerminalKind | null

    @Column({
        name: "terminal_key",
        type: "varchar",
        length: 192,
        nullable: true,
    })
        terminalKey: string | null

    @Column({
        name: "terminal_payload_hash",
        type: "bytea",
        nullable: true,
    })
        terminalPayloadHash: Buffer | null

    @Column({
        name: "terminal_fence_hash",
        type: "bytea",
        nullable: true,
    })
        terminalFenceHash: Buffer | null

    @Column({
        name: "accepted_at",
        type: "timestamptz",
    })
        acceptedAt: Date

    @Column({
        name: "started_at",
        type: "timestamptz",
        nullable: true,
    })
        startedAt: Date | null

    @Column({
        name: "terminal_at",
        type: "timestamptz",
        nullable: true,
    })
        terminalAt: Date | null

    @Column({
        name: "created_at",
        type: "timestamptz",
        default: () => "clock_timestamp()",
    })
        createdAt: Date

    @Column({
        name: "updated_at",
        type: "timestamptz",
        default: () => "clock_timestamp()",
    })
        updatedAt: Date
}
