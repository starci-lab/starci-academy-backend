import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

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
