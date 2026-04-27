import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for adding a content to favorites.",
})
export class AddToFavoritesRequest {
    @Field(
        () => ID,
        {
            description: "Content ID to favorite.",
        },
    )
        contentId: string
}
