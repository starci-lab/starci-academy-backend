import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    UserContentEntity,
} from "@modules/databases"

@ObjectType({
    description: "Response for removing a content from favorites.",
})
export class RemoveFromFavoritesResponse {
    @Field(
        () => UserContentEntity,
        {
            nullable: true,
            description: "The updated user content state.",
        },
    )
        data: UserContentEntity
}
