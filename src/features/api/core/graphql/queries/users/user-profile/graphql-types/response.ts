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
    description: "Response wrapper for the userProfile query.",
})
/** GraphQL envelope for the public `userProfile` query. */
export class UserProfileResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<UserEntity>
{
    @Field(() => UserEntity,
        {
            nullable: true,
            description: "The requested user's public profile (null when not found).",
        })
        data: UserEntity
}
