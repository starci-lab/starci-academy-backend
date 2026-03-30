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
}
