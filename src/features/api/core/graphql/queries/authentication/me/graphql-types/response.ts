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

/** GraphQL envelope for the `me` query. */
@ObjectType({
    description: "Response wrapper for the me query.",
})
export class MeResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<UserEntity>
{
    @Field(() => UserEntity,
        {
            nullable: true,
            description: "Payload containing the current user.",
        })
        data: UserEntity
}
