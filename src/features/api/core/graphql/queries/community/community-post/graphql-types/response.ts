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
    CommunityPostNodeObject,
} from "../../../../shared/community/object-types/community-post-node.object"

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
