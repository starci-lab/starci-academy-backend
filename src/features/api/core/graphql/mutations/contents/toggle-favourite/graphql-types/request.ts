import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for toggling a content's favourite state.",
})
/** GraphQL input that sends the desired favourite state (set, not flip) so retries stay idempotent. */
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
