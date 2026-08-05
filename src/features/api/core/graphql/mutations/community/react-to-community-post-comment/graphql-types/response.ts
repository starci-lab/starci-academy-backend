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
    ReactionSummaryObject,
} from "../../../../shared/discussion/object-types/reaction-summary.object"

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
