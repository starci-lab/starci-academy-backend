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
    CommunityCommentsPageObject,
} from "../../../../shared/community/object-types/community-comments-page.object"

@ObjectType({
    description: "Response wrapper for the communityPostComments query.",
})
/** Response wrapper for the communityPostComments query. */
export class CommunityPostCommentsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CommunityCommentsPageObject>
{
    /** A page of community post comment nodes + total count. */
    @Field(
        () => CommunityCommentsPageObject,
        {
            nullable: true,
            description: "A page of community post comment nodes + total count.",
        },
    )
        data: CommunityCommentsPageObject
}
