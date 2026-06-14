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

/** Response for updating the current user's profile (returns the fresh user). */
@ObjectType({
    description: "Response for updating the current user's profile.",
})
export class UpdateProfileResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<UserEntity>
{
    @Field(() => UserEntity,
        {
            nullable: true,
            description: "The updated user record.",
        })
        data: UserEntity
}
