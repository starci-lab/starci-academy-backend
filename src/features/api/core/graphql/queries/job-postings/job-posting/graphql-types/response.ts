import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    JobPostingEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Response wrapper for the jobPosting query.",
})
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
