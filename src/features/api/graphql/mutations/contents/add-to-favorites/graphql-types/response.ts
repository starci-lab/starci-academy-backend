import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    UserContentEntity,
} from "@modules/databases"

@ObjectType({
    description: "Response for adding a content to favorites.",
})
export class AddToFavoritesResponse {
    @Field(
        () => UserContentEntity,
        {
            description: "The updated user content state.",
        },
    )
        data: UserContentEntity
}
