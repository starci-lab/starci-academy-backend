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
    description: "An incomplete job row exposed as job id and status only (no payload).",
})
export class IncompleteChallengeSubmissionJobItem {
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
    description: "Flat list of incomplete jobs for the user (challenge submission pipelines).",
})
export class IncompleteChallengeSubmissionJobsResponseData {
    @Field(
        () => [IncompleteChallengeSubmissionJobItem],
        {
            description:
                "Incomplete jobs (Git + Google Docs) for the resolved `userId`, ordered by `queue_at` desc.",
        },
    )
        items: Array<IncompleteChallengeSubmissionJobItem>
}

@ObjectType({
    description: "Response wrapper for incomplete challenge submission jobs.",
})
export class IncompleteChallengeSubmissionJobsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<IncompleteChallengeSubmissionJobsResponseData>
{
    @Field(
        () => IncompleteChallengeSubmissionJobsResponseData,
        {
            nullable: true,
            description: "Payload: list of { jobId, status }.",
        },
    )
        data: IncompleteChallengeSubmissionJobsResponseData
}
