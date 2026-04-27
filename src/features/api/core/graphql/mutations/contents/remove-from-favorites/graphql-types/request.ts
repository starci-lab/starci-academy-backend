import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for removing a content from favorites.",
})
export class RemoveFromFavoritesRequest {
    @Field(
        () => ID,
        {
            description: "Content ID to remove from favorites.",
        },
    )
        contentId: string
}
