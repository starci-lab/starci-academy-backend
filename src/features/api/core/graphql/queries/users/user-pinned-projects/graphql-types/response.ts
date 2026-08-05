import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"
import {
    UserPinnedProjectItemData,
} from "./item"

@ObjectType({
    description: "Response wrapper for the userPinnedProjects query.",
})
/**
 * Response wrapper for the userPinnedProjects query: the named user's pinned
 * projects ordered by `orderIndex`.
 */
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
