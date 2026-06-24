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

/** Response wrapper for the create-community-post mutation. */
@ObjectType({
    description: "Response wrapper for the create-community-post mutation.",
})
export class CreateCommunityPostResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CommunityPostNodeObject>
{
    /** The newly created community post node. */
    @Field(
        () => CommunityPostNodeObject,
        {
            nullable: true,
            description: "The newly created community post node.",
        },
    )
        data: CommunityPostNodeObject
}
