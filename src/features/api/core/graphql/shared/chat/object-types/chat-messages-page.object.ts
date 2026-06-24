import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    ChatMessageNodeObject,
} from "./chat-message-node.object"

/** A cursor-paginated page of chat messages (newest-first). */
@ObjectType({
    description: "A cursor-paginated page of chat messages.",
})
export class ChatMessagesPageObject {
    /** The page of message nodes (newest-first). */
    @Field(
        () => [ChatMessageNodeObject],
        {
            description: "The page of message nodes.",
        },
    )
        items: Array<ChatMessageNodeObject>

    /** Opaque cursor for the next (older) page; null when there is no more. */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Opaque cursor for the next page; null when no more.",
        },
    )
        nextCursor: string | null
}
