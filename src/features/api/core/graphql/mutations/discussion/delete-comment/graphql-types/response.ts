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
    DeletedCommentObject,
} from "../../../../shared/discussion/object-types/comments-page.object"

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
