import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    DeletedCommentObject,
} from "../../../../shared/discussion"

@ObjectType({
    description: "Response wrapper for the delete-comment mutation.",
})
/** Response wrapper for the delete-comment mutation. */
export class DeleteCommentResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<DeletedCommentObject>
{
    /** The deleted comment id wrapper. */
    @Field(
        () => DeletedCommentObject,
        {
            nullable: true,
            description: "The deleted comment id wrapper.",
        },
    )
        data: DeletedCommentObject
}
