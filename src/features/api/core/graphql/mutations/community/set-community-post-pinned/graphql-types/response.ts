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

/** Response wrapper for the set-community-post-pinned mutation. */
@ObjectType({
    description: "Response wrapper for the set-community-post-pinned mutation.",
})
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
