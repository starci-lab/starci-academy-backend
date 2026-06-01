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

/** Response wrapper for the create-comment mutation. */
@ObjectType({
    description: "Response wrapper for the create-comment mutation.",
})
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
