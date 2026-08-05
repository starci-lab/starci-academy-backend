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
    description: "Response wrapper for the content reactions query.",
})
/** Response wrapper for the content reactions query. */
export class ContentReactionsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ReactionSummaryObject>
{
    /** The content's reaction summary from the viewer's view. */
    @Field(
        () => ReactionSummaryObject,
        {
            nullable: true,
            description: "The content's reaction summary from the viewer's view.",
        },
    )
        data: ReactionSummaryObject
}
