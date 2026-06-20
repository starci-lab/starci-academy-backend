import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/**
 * One prior turn in the content-AI conversation, sent by the client so the model
 * keeps short-term memory. `role` is `"user"` or `"assistant"`.
 */
@InputType({
    description: "A prior turn in the content AI conversation.",
})
export class ContentAiChatMessageInput {
    @Field(
        () => String,
        {
            description: "Who sent the message: 'user' or 'assistant'.",
        },
    )
        role: string

    @Field(
        () => String,
        {
            description: "The message text.",
        },
    )
        content: string
}

/**
 * Request for {@link AskContentAiResponse}: ask StarCi AI a question grounded in
 * one content's body. The server loads the content + body by id — the client only
 * sends the question + the recent conversation turns for short-term memory.
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

    @Field(
        () => [ContentAiChatMessageInput],
        {
            nullable: true,
            description: "Recent prior turns (oldest first); capped server-side for cost.",
        },
    )
        history?: Array<ContentAiChatMessageInput>
}
