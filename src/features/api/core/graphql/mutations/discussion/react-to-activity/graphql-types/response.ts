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
    description: "Response wrapper for the react-to-activity mutation.",
})
/** Response wrapper for the react-to-activity mutation. */
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
