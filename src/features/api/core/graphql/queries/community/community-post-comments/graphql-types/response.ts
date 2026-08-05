import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    CommunityCommentsPageObject,
} from "../../../../shared/community"

@ObjectType({
    description: "Response wrapper for the communityPostComments query.",
})
/** Response wrapper for the communityPostComments query. */
export class CommunityPostCommentsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CommunityCommentsPageObject>
{
    /** A page of community post comment nodes + total count. */
    @Field(
        () => CommunityCommentsPageObject,
        {
            nullable: true,
            description: "A page of community post comment nodes + total count.",
        },
    )
        data: CommunityCommentsPageObject
}
