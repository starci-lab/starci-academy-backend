import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    CommunityPostNodeObject,
} from "../../../../shared/community"

@ObjectType({
    description: "Response wrapper for the communityPost query.",
})
/** Response wrapper for the communityPost query. */
export class CommunityPostResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CommunityPostNodeObject>
{
    /** The requested community post node. */
    @Field(
        () => CommunityPostNodeObject,
        {
            nullable: true,
            description: "The requested community post node.",
        },
    )
        data: CommunityPostNodeObject
}
