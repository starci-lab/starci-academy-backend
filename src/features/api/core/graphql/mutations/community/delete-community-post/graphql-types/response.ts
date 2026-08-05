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
    DeletedCommunityPostObject,
} from "../../../../shared/community/object-types/community-comments-page.object"

@ObjectType({
    description: "Response wrapper for the delete-community-post mutation.",
})
/** Response wrapper for the delete-community-post mutation. */
export class DeleteCommunityPostResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<DeletedCommunityPostObject>
{
    /** The soft-deleted post id. */
    @Field(
        () => DeletedCommunityPostObject,
        {
            nullable: true,
            description: "The soft-deleted post id.",
        },
    )
        data: DeletedCommunityPostObject
}
