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

/** Response wrapper for the update-community-post mutation. */
@ObjectType({
    description: "Response wrapper for the update-community-post mutation.",
})
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
