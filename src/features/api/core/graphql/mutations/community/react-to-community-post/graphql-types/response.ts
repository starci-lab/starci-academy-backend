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
    description: "Response wrapper for the react-to-community-post mutation.",
})
/** Response wrapper for the react-to-community-post mutation. */
export class ReactToCommunityPostResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ReactionSummaryObject>
{
    /** The post's refreshed reaction summary. */
    @Field(
        () => ReactionSummaryObject,
        {
            nullable: true,
            description: "The post's refreshed reaction summary.",
        },
    )
        data: ReactionSummaryObject
}
