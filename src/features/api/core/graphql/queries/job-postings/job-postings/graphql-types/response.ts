import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    JobPostingEntity,
} from "@modules/databases/postgresql/primary/entities/job-posting.entity"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Paginated job postings.",
})
/**
 * Paginated job postings (newest first).
 */
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

@ObjectType({
    description: "Response wrapper for the jobPostings query.",
})
/**
 * Response wrapper for the jobPostings query.
 */
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
