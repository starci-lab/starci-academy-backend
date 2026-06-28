import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/**
 * Request for {@link ClearContentAiHistoryResponse}: delete the current user's
 * saved content-AI conversation for one content (scoped to their enrollment).
 */
@InputType({
    description: "Delete a content-AI conversation (session).",
})
export class ClearContentAiHistoryRequest {
    @Field(
        () => ID,
        {
            description: "Conversation (session) to delete.",
        },
    )
        sessionId: string
}
