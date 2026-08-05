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
    description: "Response wrapper for the set-community-post-pinned mutation.",
})
/** Response wrapper for the set-community-post-pinned mutation. */
export class SetCommunityPostPinnedResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CommunityPostNodeObject>
{
    /** The updated community post node. */
    @Field(
        () => CommunityPostNodeObject,
        {
            nullable: true,
            description: "The updated community post node.",
        },
    )
        data: CommunityPostNodeObject
}
