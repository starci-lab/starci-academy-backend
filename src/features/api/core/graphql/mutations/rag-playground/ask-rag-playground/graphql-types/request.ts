import {
    Field,
    InputType,
} from "@nestjs/graphql"

/** Ask a question grounded in a RAG Playground session's indexed source. */
@InputType({
    description: "Ask a question grounded in a public RAG Playground session's indexed source.",
})
export class AskRagPlaygroundRequest {
    @Field(
        () => String,
        {
            description: "The session whose indexed source to search.",
        },
    )
        sessionId: string

    @Field(
        () => String,
        {
            description: "The visitor's question.",
        },
    )
        question: string
}
