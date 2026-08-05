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
    description: "Response wrapper for the create-community-post-comment mutation.",
})
/** Response wrapper for the create-community-post-comment mutation. */
export class CreateCommunityPostCommentResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CommunityCommentNodeObject>
{
    /** The newly created comment node. */
    @Field(
        () => CommunityCommentNodeObject,
        {
            nullable: true,
            description: "The newly created comment node.",
        },
    )
        data: CommunityCommentNodeObject
}
