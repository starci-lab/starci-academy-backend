import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
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

/**
 * Tracks lifecycle status of worker jobs.
 */
@ObjectType({
    description: "Worker job status record.",
})
@Entity("jobs")
export class JobEntity extends UuidAbstractEntity {
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
            default: JobStatus.Processing,
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
        error?: string

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
        executionResults?: string

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
        executionState?: string
}
