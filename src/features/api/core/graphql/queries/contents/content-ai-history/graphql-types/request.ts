import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Load a content-AI conversation's (session's) saved turns.",
})
/**
 * Request for {@link ContentAiHistoryResponse}: load the saved content-AI
 * conversation the current user has about one content (scoped server-side to
 * their enrollment).
 */
export class ContentAiHistoryRequest {
    @Field(
        () => ID,
        {
            description: "Conversation (session) whose turns to load.",
        },
    )
        sessionId: string
}
