import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    MockInterviewSessionEntity,
} from "./mock-interview-session.entity"

/** Durable PostgreSQL grading-job lifecycle. */
export type MockInterviewGradingJobStatus =
    | "queued"
    | "leased"
    | "retry_scheduled"
    | "completed"
    | "failed"

@Entity("mock_interview_grading_jobs")
@Index("uq_mock_interview_grading_jobs_session_id",
    ["sessionId"],
    {
        unique: true
    })
@Index("idx_mock_interview_grading_jobs_dispatch",
    ["status",
        "availableAt"])
/** PostgreSQL authority for asynchronous mock-interview grading work. */
export class MockInterviewGradingJobEntity extends UuidAbstractEntity {
    @ManyToOne(() => MockInterviewSessionEntity,
        {
            onDelete: "CASCADE", nullable: false
        })
    @JoinColumn({
        name: "session_id", foreignKeyConstraintName: "fk_session_id_mock_interview_grading_jobs"
    })
        session: MockInterviewSessionEntity

    @Column({
        name: "session_id", type: "uuid"
    })
    @RelationId((job: MockInterviewGradingJobEntity) => job.session)
        sessionId: string

    @Column({
        name: "status", type: "varchar", default: "queued"
    })
        status: MockInterviewGradingJobStatus

    @Column({
        name: "attempt_count", type: "int", default: 0
    })
        attemptCount: number

    @Column({
        name: "max_attempts", type: "int", default: 3
    })
        maxAttempts: number

    @Column({
        name: "available_at", type: "timestamptz", default: () => "CURRENT_TIMESTAMP"
    })
        availableAt: Date

    @Column({
        name: "lease_token", type: "uuid", nullable: true
    })
        leaseToken: string | null

    @Column({
        name: "lease_expires_at", type: "timestamptz", nullable: true
    })
        leaseExpiresAt: Date | null

    @Column({
        name: "last_dispatched_at", type: "timestamptz", nullable: true
    })
        lastDispatchedAt: Date | null

    @Column({
        name: "selected_model", type: "varchar", nullable: true
    })
        selectedModel: string | null

    @Column({
        name: "selected_model_provider", type: "varchar", nullable: true
    })
        selectedModelProvider: string | null

    @Column({
        name: "provider_request_id", type: "varchar", nullable: true
    })
        providerRequestId: string | null

    @Column({
        name: "prompt_fingerprint", type: "varchar", nullable: true
    })
        promptFingerprint: string | null

    @Column({
        name: "usage", type: "jsonb", nullable: true
    })
        usage: Record<string, unknown> | null

    @Column({
        name: "last_error", type: "text", nullable: true
    })
        lastError: string | null

    @Column({
        name: "completed_at", type: "timestamptz", nullable: true
    })
        completedAt: Date | null
}
