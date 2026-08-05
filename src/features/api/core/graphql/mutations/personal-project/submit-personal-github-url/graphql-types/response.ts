import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    EnrollmentEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Response for submit personal GitHub URL mutation.",
})
/**
 * Returns the updated enrollment (not a job) -- this write is synchronous.
 * `data` is nullable for the interceptor error path.
 */
export class SubmitPersonalGithubUrlResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<EnrollmentEntity>
{
    @Field(() => EnrollmentEntity,
        {
            nullable: true,
            description: "The updated enrollment.",
        })
        data: EnrollmentEntity
}
