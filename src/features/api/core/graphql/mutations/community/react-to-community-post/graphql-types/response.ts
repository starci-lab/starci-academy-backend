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
