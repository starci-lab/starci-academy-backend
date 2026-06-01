import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    CommentsPageObject,
} from "../../../../shared/discussion"

/** Response wrapper for the content comments query. */
@ObjectType({
    description: "Response wrapper for the content comments query.",
})
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
