import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    CommunityCommentNodeObject,
} from "../../../../shared/community"

/** Response wrapper for the update-community-post-comment mutation. */
@ObjectType({
    description: "Response wrapper for the update-community-post-comment mutation.",
})
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
