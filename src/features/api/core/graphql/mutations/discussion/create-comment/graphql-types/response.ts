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
    description: "Response wrapper for the create-comment mutation.",
})
/** Response wrapper for the create-comment mutation. */
export class CreateCommentResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CommentNodeObject>
{
    /** The newly created comment node. */
    @Field(
        () => CommentNodeObject,
        {
            nullable: true,
            description: "The newly created comment node.",
        },
    )
        data: CommentNodeObject
}
