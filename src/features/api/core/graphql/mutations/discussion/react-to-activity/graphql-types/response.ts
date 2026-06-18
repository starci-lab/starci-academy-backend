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

/** Response wrapper for the react-to-activity mutation. */
@ObjectType({
    description: "Response wrapper for the react-to-activity mutation.",
})
export class ReactToActivityResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ReactionSummaryObject>
{
    /** The activity's refreshed reaction summary. */
    @Field(
        () => ReactionSummaryObject,
        {
            nullable: true,
            description: "The activity's refreshed reaction summary.",
        },
    )
        data: ReactionSummaryObject
}
