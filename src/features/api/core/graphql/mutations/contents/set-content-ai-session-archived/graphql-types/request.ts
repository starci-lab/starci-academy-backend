import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/**
 * Request for {@link SetContentAiSessionArchivedResponse}: archive or unarchive a
 * conversation. Archived conversations drop from the default history list but stay
 * searchable.
 */
@InputType({
    description: "Archive or unarchive a content-AI conversation.",
})
export class SetContentAiSessionArchivedRequest {
    @Field(
        () => ID,
        {
            description: "Conversation (session) to archive / unarchive.",
        },
    )
        sessionId: string

    @Field(
        () => Boolean,
        {
            description: "true = archive (stamp archived_at); false = unarchive (clear it).",
        },
    )
        archived: boolean
}
