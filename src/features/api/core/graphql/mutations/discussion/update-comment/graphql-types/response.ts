import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    CommentNodeObject,
} from "../../../../shared/discussion"

/** Response wrapper for the update-comment mutation. */
@ObjectType({
    description: "Response wrapper for the update-comment mutation.",
})
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
