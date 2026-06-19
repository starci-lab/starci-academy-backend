import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/**
 * Request for {@link AskContentAiResponse}: ask StarCi AI a question grounded in
 * one content's body. The server loads the content + body by id — the client only
 * sends the question.
 */
@InputType({
    description: "Ask StarCi AI a question about a piece of content.",
})
export class AskContentAiRequest {
    @Field(
        () => ID,
        {
            description: "Content the question is about.",
        },
    )
        contentId: string

    @Field(
        () => String,
        {
            description: "The learner's question about this content.",
        },
    )
        question: string
}
