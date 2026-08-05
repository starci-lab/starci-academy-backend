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
    CommentNodeObject,
} from "../../../../shared/discussion/object-types/comment-node.object"

@ObjectType({
    description: "Response wrapper for the update-comment mutation.",
})
/** Response wrapper for the update-comment mutation. */
export class UpdateCommentResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CommentNodeObject>
{
    /** The updated comment node. */
    @Field(
        () => CommentNodeObject,
        {
            nullable: true,
            description: "The updated comment node.",
        },
    )
        data: CommentNodeObject
}
