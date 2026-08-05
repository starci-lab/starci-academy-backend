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
    CommentsPageObject,
} from "../../../../shared/discussion/object-types/comments-page.object"

@ObjectType({
    description: "Response wrapper for the content comments query.",
})
/** Response wrapper for the content comments query. */
export class ContentCommentsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CommentsPageObject>
{
    /** The page of comments for the requested scope. */
    @Field(
        () => CommentsPageObject,
        {
            nullable: true,
            description: "The page of comments for the requested scope.",
        },
    )
        data: CommentsPageObject
}
