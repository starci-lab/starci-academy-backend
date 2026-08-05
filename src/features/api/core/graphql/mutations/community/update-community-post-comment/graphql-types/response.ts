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
    CommunityCommentNodeObject,
} from "../../../../shared/community/object-types/community-comment-node.object"

@ObjectType({
    description: "Response wrapper for the update-community-post-comment mutation.",
})
/** Response wrapper for the update-community-post-comment mutation. */
export class UpdateCommunityPostCommentResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CommunityCommentNodeObject>
{
    /** The updated comment node. */
    @Field(
        () => CommunityCommentNodeObject,
        {
            nullable: true,
            description: "The updated comment node.",
        },
    )
        data: CommunityCommentNodeObject
}
