import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Mark a content-AI conversation as just-opened.",
})
/**
 * Request for {@link TouchContentAiSessionResponse}: mark a conversation as
 * just-opened (bumps its recency so it is auto-reopened on reload).
 */
export class TouchContentAiSessionRequest {
    @Field(
        () => ID,
        {
            description: "Conversation (session) just opened.",
        },
    )
        sessionId: string
}
