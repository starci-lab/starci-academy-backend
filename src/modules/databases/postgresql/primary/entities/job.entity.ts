import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    Index,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    JobStatus,
    GraphQLTypeJobStatus,
    ActionType,
    GraphQLTypeActionType,
    JobCategory,
    GraphQLTypeJobCategory,
} from "../enums"

/**
 * Loose, queryable correlation map a job carries to the domain rows it touches.
 *
 * `jobs` is an infrastructure table (queue + execution ledger) shared by every
 * `actionType`, so it deliberately holds NO foreign keys into domain tables —
 * the domain ids live here as plain values (and in the worker `payload`). To
 * filter jobs by one of these keys, add an expression index on `refs->>'key'`.
 */
export interface JobRefs {
    /** Owning challenge submission requirement (grading jobs). */
    challengeSubmissionId?: string
    /** The specific user submission being graded. */
    userChallengeSubmissionId?: string
    /** Enrollment the job runs under. */
    enrollmentId?: string
    /** Milestone task being reviewed. */
    taskId?: string
    /** AI-lab eval run being graded. */
    aiLabRunId?: string
    /** CV submission being reviewed. */
    cvSubmissionId?: string
}

/**
 * Tracks lifecycle status of worker jobs. Pure infrastructure: no FK to domain
 * tables — correlate via {@link JobRefs} (`refs`) and the serialized `payload`.
 */
@ObjectType({
    description: "Worker job status record.",
})
@Index(["userId"])
@Entity("jobs")
export class JobEntity extends UuidAbstractEntity {
    /**
     * Loose owner id (no FK) — the user this job is associated with, when applicable.
     */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "User this job is associated with (loose id, no FK).",
        },
    )
    @Column({
        name: "user_id",
        type: "uuid",
        nullable: true,
    })
        userId: string | null

    /**
     * Loose correlation map to the domain rows this job touches (no FK).
     */
    @Column({
        name: "refs",
        type: "jsonb",
        default: {
        },
    })
        refs: JobRefs

    @Field(
        () => Date,
        {
            description: "When the job was queued for processing.",
        },
    )
    @Column(
        {
            name: "queue_at",
            type: "timestamptz",
            default: () => "NOW()",
        },
    )
        queueAt: Date

    @Field(
        () => String,
        {
            description: "Serialized job payload (worker input).",
        },
    )
    @Column(
        {
            name: "payload",
            type: "text",
        },
    )
        payload: string

    @Field(
        () => GraphQLTypeJobStatus,
        {
            description: "Current lifecycle status of the job.",
        },
    )
    @Column(
        {
            name: "status",
            type: "enum",
            enum: JobStatus,
            enumName: "job_status",
            default: JobStatus.Queued,
        },
    )
        status: JobStatus

    @Field(
        () => String,
        {
            nullable: true,
            description: "Error message when the job failed.",
        },
    )
    @Column(
        {
            name: "error",
            type: "text",
            nullable: true,
        },
    )
        error: string | null

    @Field(
        () => Int,
        {
            description: "Maximum number of steps the worker may execute.",
        },
    )
    @Column(
        {
            name: "max_steps",
            type: "integer",
            default: 0,
        },
    )
        maxSteps: number

    @Field(
        () => Int,
        {
            description: "Current step index within the job workflow.",
        },
    )
    @Column(
        {
            name: "current_step",
            type: "integer",
            default: 0,
        },
    )
        currentStep: number

    /**
     * How many times this job has been dispatched/run (poison-pill cap → DLQ).
     */
    @Field(
        () => Int,
        {
            description: "How many times this job has been dispatched/run.",
        },
    )
    @Column(
        {
            name: "attempts",
            type: "integer",
            default: 0,
        },
    )
        attempts: number

    /**
     * Max dispatch attempts before the job is dead-lettered (status Failed).
     */
    @Field(
        () => Int,
        {
            description: "Max dispatch attempts before dead-lettering.",
        },
    )
    @Column(
        {
            name: "max_attempts",
            type: "integer",
            default: 5,
        },
    )
        maxAttempts: number

    /**
     * Monotonic token bumped on every claim/requeue. Side-effect writes guard on
     * it so a zombie worker (lease lost, then resumed) cannot double-apply.
     */
    @Field(
        () => Int,
        {
            description: "Monotonic fencing token (zombie-write guard).",
        },
    )
    @Column(
        {
            name: "fencing_token",
            type: "integer",
            default: 0,
        },
    )
        fencingToken: number

    @Field(
        () => GraphQLTypeActionType,
        {
            description: "Domain action type this job performs.",
        },
    )
    @Column(
        {
            name: "action_type",
            type: "enum",
            enum: ActionType,
        },
    )
        actionType: ActionType

    @Field(
        () => GraphQLTypeJobCategory,
        {
            nullable: true,
            description: "UI-facing job category for realtime rendering.",
        },
    )
    @Column(
        {
            name: "category",
            type: "varchar",
            nullable: true,
        },
    )
        category: JobCategory | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Serialized results after successful or partial execution.",
        },
    )
    @Column(
        {
            name: "execution_results",
            type: "text",
            nullable: true,
        },
    )
        executionResults: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Execution state of the job.",
        },
    )
    @Column(
        {
            name: "execution_state",
            type: "text",
            nullable: true,
        },
    )
        executionState: string | null
}
