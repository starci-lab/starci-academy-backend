import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    JobPostingEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * Paginated job postings (newest first).
 */
@ObjectType({
    description: "Paginated job postings.",
})
export class JobPostingsData {
    @Field(
        () => [JobPostingEntity],
        {
            description: "Job postings for the requested page, newest first.",
        },
    )
        items: Array<JobPostingEntity>

    @Field(
        () => Int,
        {
            description: "Total number of postings matching the filters (across all pages).",
        },
    )
        total: number
}

/**
 * Response wrapper for the jobPostings query.
 */
@ObjectType({
    description: "Response wrapper for the jobPostings query.",
})
export class JobPostingsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<JobPostingsData>
{
    @Field(
        () => JobPostingsData,
        {
            nullable: true,
            description: "Paginated job postings.",
        },
    )
        data: JobPostingsData
}
