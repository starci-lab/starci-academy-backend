import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    DeletedCommunityCommentObject,
} from "../../../../shared/community"

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
