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

/** Response wrapper for the content reactions query. */
@ObjectType({
    description: "Response wrapper for the content reactions query.",
})
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
