import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    UserEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Response wrapper for the connectGithubAccount mutation.",
})
/**
 * GraphQL envelope for the connectGithubAccount mutation.
 */
export class ConnectGithubAccountResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<UserEntity>
{
    @Field(() => UserEntity,
        {
            nullable: true,
            description: "Payload containing the updated user with GitHub username.",
        })
        data: UserEntity
}
