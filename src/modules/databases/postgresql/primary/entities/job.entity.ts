import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    JobStatus,
    GraphQLTypeJobStatus,
    ActionType,
    GraphQLTypeActionType,
} from "../enums"
import {
    UserEntity,
} from "./user.entity"
import {
    ChallengeSubmissionEntity,
} from "./challenge-submission.entity"

/**
 * Tracks lifecycle status of worker jobs.
 */
@ObjectType({
    description: "Worker job status record.",
})
@Entity("jobs")
export class JobEntity extends UuidAbstractEntity {
    @Field(
        () => UserEntity,
        {
            description: "User this job is associated with (when applicable).",
        },
    )
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "SET NULL",
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_jobs_user_id_users",
    })
        user: UserEntity

    @Field(
        () => ID,
        {
            description: "Foreign key to `users.id` when this job is scoped to a user.",
        },
    )
    @RelationId(
        (job: JobEntity) => job.user,
    )
        userId: string

    @Field(
        () => ChallengeSubmissionEntity,
        {
            nullable: true,
            description: "Challenge submission requirement this job targets (when applicable).",
        },
    )
    @ManyToOne(
        () => ChallengeSubmissionEntity,
        (submission: ChallengeSubmissionEntity) => submission.jobs,
        {
            nullable: true,
            onDelete: "SET NULL",
        },
    )
    @JoinColumn({
        name: "challenge_submission_id",
        foreignKeyConstraintName:
            "fk_jobs_challenge_submission_id_challenge_submissions",
    })
        challengeSubmission: ChallengeSubmissionEntity | null

    @Field(
        () => ID,
        {
            nullable: true,
            description:
                "Foreign key to `challenge_submissions.id` when this job targets a submission requirement.",
        },
    )
    @RelationId(
        (job: JobEntity) => job.challengeSubmission,
    )
        challengeSubmissionId: string | null

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
