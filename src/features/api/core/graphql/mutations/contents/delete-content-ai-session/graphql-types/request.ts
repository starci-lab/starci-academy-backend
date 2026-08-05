import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Delete a content-AI conversation (session).",
})
/**
 * Request for {@link DeleteContentAiSessionResponse}: delete the current user's
 * saved content-AI conversation for one content (scoped to their enrollment).
 */
export class DeleteContentAiSessionRequest {
    @Field(
        () => ID,
        {
            description: "Conversation (session) to delete.",
        },
    )
        sessionId: string
}
