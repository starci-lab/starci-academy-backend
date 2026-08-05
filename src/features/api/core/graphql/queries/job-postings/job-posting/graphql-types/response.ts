import {
    Field,
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
    description: "Response wrapper for the jobPosting query.",
})
/**
 * GraphQL envelope for the public `jobPosting` detail page. `data` includes
 * the employer company so the FE can render the posting without a second
 * company fetch.
 */
export class JobPostingResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<JobPostingEntity>
{
    @Field(
        () => JobPostingEntity,
        {
            nullable: true,
            description: "Job posting payload, with its employer company resolved.",
        },
    )
        data: JobPostingEntity
}
