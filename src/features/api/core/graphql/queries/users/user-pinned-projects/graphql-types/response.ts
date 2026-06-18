import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    UserPinnedProjectItemData,
} from "./item"

/**
 * Response wrapper for the userPinnedProjects query: the named user's pinned
 * projects ordered by `orderIndex`.
 */
@ObjectType({
    description: "Response wrapper for the userPinnedProjects query.",
})
export class UserPinnedProjectsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<UserPinnedProjectItemData>> {
    @Field(
        () => [UserPinnedProjectItemData],
        {
            description: "The named user's pinned projects, ordered by orderIndex.",
        },
    )
        data: Array<UserPinnedProjectItemData>
}
