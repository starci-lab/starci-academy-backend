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

/** Response wrapper for the create-community-post-comment mutation. */
@ObjectType({
    description: "Response wrapper for the create-community-post-comment mutation.",
})
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
