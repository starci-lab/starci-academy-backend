import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    GraphQLTypeJobStatus,
    JobStatus,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "An incompleted job row exposed as job id and status only (no payload).",
})
export class IncompletedJobItem {
    @Field(
        () => ID,
        {
            description: "Job primary id (`jobs.id`).",
        },
    )
        jobId: string

    @Field(
        () => GraphQLTypeJobStatus,
        {
            description: "Current job status.",
        },
    )
        status: JobStatus
}

@ObjectType({
    description: "Flat list of incompleted jobs for the user (challenge submission pipelines).",
})
export class IncompletedJobsResponseData {
    @Field(
        () => [IncompletedJobItem],
        {
            description:
                "Incompleted jobs (Git + Google Docs) for the resolved `userId`, ordered by `queue_at` desc.",
        },
    )
        items: Array<IncompletedJobItem>
}

@ObjectType({
    description: "Response wrapper for incompleted jobs.",
})
export class IncompletedJobsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<IncompletedJobsResponseData>
{
    @Field(
        () => IncompletedJobsResponseData,
        {
            nullable: true,
            description: "Payload: list of { jobId, status }.",
        },
    )
        data: IncompletedJobsResponseData
}
