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

/** Response wrapper for the react-to-content mutation. */
@ObjectType({
    description: "Response wrapper for the react-to-content mutation.",
})
export class ReactToContentResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ReactionSummaryObject>
{
    /** The content's refreshed reaction summary. */
    @Field(
        () => ReactionSummaryObject,
        {
            nullable: true,
            description: "The content's refreshed reaction summary.",
        },
    )
        data: ReactionSummaryObject
}
