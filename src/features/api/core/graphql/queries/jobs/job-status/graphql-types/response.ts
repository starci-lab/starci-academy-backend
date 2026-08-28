import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import type {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"
import {
    ActionType,
    GraphQLTypeActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    GraphQLTypeJobCategory,
    JobCategory,
} from "@modules/databases/postgresql/primary/enums/job-category"
import {
    GraphQLTypeJobStatus,
    JobStatus,
} from "@modules/databases/postgresql/primary/enums/job-status"

@ObjectType()
/** Typed pointer to the exact domain result published by a completed job. */
export class JobResultRef {
    @Field(() => String)
        kind: string

    @Field(() => ID)
        id: string
}

@ObjectType({
    description: "Safe owner-authorized durable job status.",
})
/** Safe job lifecycle item shared with the realtime transport. */
export class JobStatusItem {
    @Field(() => ID)
        jobId: string

    @Field(() => GraphQLTypeJobStatus)
        status: JobStatus

    @Field(
        () => GraphQLTypeJobCategory,
        {
            nullable: true,
        },
    )
        category: JobCategory | null

    @Field(() => GraphQLTypeActionType)
        actionType: ActionType

    @Field(() => Int)
        currentStep: number

    @Field(() => Int)
        maxSteps: number

    @Field(() => Date)
        updatedAt: Date

    @Field(() => Boolean)
        retryable: boolean

    @Field(
        () => String,
        {
            nullable: true,
        },
    )
        failureReason: string | null

    @Field(
        () => JobResultRef,
        {
            nullable: true,
        },
    )
        result: JobResultRef | null
}

@ObjectType()
/** GraphQL data envelope allowing an absent or foreign job to resolve as null. */
export class JobStatusResponseData {
    @Field(
        () => JobStatusItem,
        {
            nullable: true,
            description: "Null when the job is absent or belongs to another user.",
        },
    )
        job: JobStatusItem | null
}

@ObjectType()
/** Standard GraphQL response wrapper for the owner-authorized job read. */
export class JobStatusResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<JobStatusResponseData>
{
    @Field(
        () => JobStatusResponseData,
        {
            nullable: true,
        },
    )
        data: JobStatusResponseData
}
