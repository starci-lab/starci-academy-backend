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
    description: "Response wrapper for the update-community-post mutation.",
})
/** Response wrapper for the update-community-post mutation. */
export class UpdateCommunityPostResponse
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
