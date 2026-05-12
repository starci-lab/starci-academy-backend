import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for toggling a content's favourite state.",
})
export class ToggleFavouriteRequest {
    @Field(
        () => ID,
        {
            description: "Content ID to toggle favourite for.",
        },
    )
        contentId: string

    @Field(
        () => Boolean,
        {
            description: "Whether the content should be marked as favourite.",
        },
    )
        isFavorite: boolean
}
