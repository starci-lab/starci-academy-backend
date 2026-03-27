import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    Unique,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    JobStatus,
    GraphQLTypeJobStatus,
} from "../enums"

/**
 * Tracks lifecycle status of worker jobs.
 */
@ObjectType({
    description: "Worker job status record.",
})
@Entity("jobs")
@Unique(
    "UQ_jobs_queue_bullmq_job_id",
    [
        "queueName",
        "bullmqJobId",
    ],
)
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
            name: "queue_name",
            type: "varchar",
            length: 128,
        },
    )
        queueName: string

    @Field(
        () => String,
        {
            nullable: true,
        },
    )
    @Column(
        {
            name: "bullmq_job_id",
            type: "varchar",
            length: 128,
            nullable: true,
        },
    )
        bullmqJobId: string | null

    @Field(
        () => String,
        {
            nullable: true,
        },
    )
    @Column(
        {
            name: "payload",
            type: "text",
            nullable: true,
        },
    )
        payload: string | null

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
}
