import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for a content's aggregate reaction summary.",
})
/** Request for a content's aggregate reaction summary. */
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
