import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    ReactionSummaryObject,
} from "../../../../shared/discussion"

@ObjectType({
    description: "Response wrapper for the react-to-community-post-comment mutation.",
})
/** Response wrapper for the react-to-community-post-comment mutation. */
export class ReactToCommunityPostCommentResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ReactionSummaryObject>
{
    /** The comment's refreshed reaction summary. */
    @Field(
        () => ReactionSummaryObject,
        {
            nullable: true,
            description: "The comment's refreshed reaction summary.",
        },
    )
        data: ReactionSummaryObject
}
