import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/** Request for a content's aggregate reaction summary. */
@InputType({
    description: "Request for a content's aggregate reaction summary.",
})
export class ContentReactionsRequest {
    /** Content to summarize reactions for. */
    @Field(
        () => ID,
        {
            description: "Content to summarize reactions for.",
        },
    )
        contentId: string
}
