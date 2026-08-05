import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    UserEntity,
} from "@modules/databases"

@ObjectType({
    description: "A chat message with author + viewer flags.",
})
/** A single chat message shaped for the client. */
export class ChatMessageNodeObject {
    /** Message primary id. */
    @Field(
        () => ID,
        {
            description: "Message primary id.",
        },
    )
        id: string

    /** Owning conversation id. */
    @Field(
        () => ID,
        {
            description: "Owning conversation id.",
        },
    )
        conversationId: string

    /** Message body. */
    @Field(
        () => String,
        {
            description: "Message body authored by the user.",
        },
    )
        body: string

    /** Row creation timestamp. */
    @Field(
        () => Date,
        {
            description: "Row creation timestamp.",
        },
    )
        createdAt: Date

    /** Author of the message. */
    @Field(
        () => UserEntity,
        {
            description: "Author of the message.",
        },
    )
        author: UserEntity

    /** Whether the viewing user authored this message. */
    @Field(
        () => Boolean,
        {
            description: "Whether the viewing user authored this message.",
        },
    )
        isMine: boolean

    /** Whether the author is the founder (drives the founder badge on the FE). */
    @Field(
        () => Boolean,
        {
            description: "Whether the author is the founder.",
        },
    )
        isFounderAuthor: boolean
}
