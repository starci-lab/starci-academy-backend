import {
    Field,
    ID,
    InputType,
    Int,
} from "@nestjs/graphql"

/** Cursor-paginated request for a conversation's messages. */
@InputType({
    description: "Cursor-paginated request for a conversation's messages.",
})
export class ChatMessagesRequest {
    /** Conversation whose messages are listed. */
    @Field(
        () => ID,
        {
            description: "Conversation whose messages are listed.",
        },
    )
        conversationId: string

    /** Opaque cursor from the previous page's nextCursor; omit for page 1. */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Opaque cursor from the previous page's nextCursor; omit for page 1.",
        },
    )
        cursor?: string

    /** Max messages per page. */
    @Field(
        () => Int,
        {
            defaultValue: 30,
            description: "Max messages per page.",
        },
    )
        limit?: number
}
