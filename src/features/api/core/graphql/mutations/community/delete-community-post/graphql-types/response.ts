import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    DeletedCommunityPostObject,
} from "../../../../shared/community"

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
