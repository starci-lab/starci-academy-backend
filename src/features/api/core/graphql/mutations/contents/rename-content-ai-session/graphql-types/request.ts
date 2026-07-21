import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/**
 * Request for {@link RenameContentAiSessionResponse}: rename a conversation. The
 * title overwrites the existing one outright; a blank title resets it to NULL so
 * the session falls back to auto-titling from its first question.
 */
@InputType({
    description: "Rename a content-AI conversation (blank title resets to auto-title).",
})
export class RenameContentAiSessionRequest {
    @Field(
        () => ID,
        {
            description: "Conversation (session) to rename.",
        },
    )
        sessionId: string

    @Field(
        () => String,
        {
            description: "New title (≤200 chars). Blank resets to auto-titling.",
        },
    )
        title: string
}
