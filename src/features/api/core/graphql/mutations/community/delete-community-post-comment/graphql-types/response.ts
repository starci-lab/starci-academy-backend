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
    DeletedCommunityCommentObject,
} from "../../../../shared/community/object-types/community-comments-page.object"

@ObjectType({
    description: "Response wrapper for the delete-community-post-comment mutation.",
})
/** Response wrapper for the delete-community-post-comment mutation. */
export class DeleteCommunityPostCommentResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<DeletedCommunityCommentObject>
{
    /** The soft-deleted comment id. */
    @Field(
        () => DeletedCommunityCommentObject,
        {
            nullable: true,
            description: "The soft-deleted comment id.",
        },
    )
        data: DeletedCommunityCommentObject
}
