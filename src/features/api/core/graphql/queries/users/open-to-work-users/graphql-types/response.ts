import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    UserEntity,
} from "@modules/databases"

/**
 * Response wrapper for the openToWorkUsers query — a page of users who opted into
 * "open to work". Each item is a `UserEntity`, so the shared resolved fields
 * (follower / following counts) come along; the client renders a candidate card
 * and links to `/profile/<username>`.
 */
@ObjectType({
    description: "Response wrapper for the openToWorkUsers query.",
})
export class OpenToWorkUsersResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<UserEntity>> {
    @Field(
        () => [UserEntity],
        {
            nullable: true,
            description: "Users open to work, newest first.",
        },
    )
        data: Array<UserEntity>
}
