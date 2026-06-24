import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    ChatConversationEntity,
} from "./chat-conversation.entity"
import {
    UserEntity,
} from "./user.entity"

/**
 * A single chat message inside a {@link ChatConversationEntity}. Deletion is soft
 * (`isDeleted`) so the thread shape survives.
 */
@ObjectType({
    description: "A single chat message in a conversation.",
})
@Entity("chat_messages")
@Index(
    "IDX_chat_messages_conversation_created",
    [
        "conversation",
        "createdAt",
    ],
)
export class ChatMessageEntity extends UuidAbstractEntity {
    /**
     * Raw message body authored by the user.
     */
    @Field(
        () => String,
        {
            description: "Message body authored by the user.",
        },
    )
    @Column({
        name: "body",
        type: "text",
    })
        body: string

    /**
     * Soft-delete flag (keeps the row so the thread does not collapse).
     */
    @Field(
        () => Boolean,
        {
            description: "Whether the message was soft-deleted by its author.",
        },
    )
    @Column({
        name: "is_deleted",
        type: "boolean",
        default: false,
    })
        isDeleted: boolean

    /**
     * Conversation this message belongs to.
     */
    @ManyToOne(
        () => ChatConversationEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "conversation_id",
        foreignKeyConstraintName: "fk_conversation_id_chat_messages_chat_conversations",
    })
        conversation: ChatConversationEntity

    /**
     * Owning conversation id (denormalized via relation).
     */
    @Field(
        () => ID,
        {
            description: "Owning conversation id.",
        },
    )
    @RelationId(
        (message: ChatMessageEntity) => message.conversation,
    )
        conversationId: string

    /**
     * Author of the message.
     */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_chat_messages_users",
    })
        author: UserEntity

    /**
     * Author user id (denormalized via relation).
     */
    @Field(
        () => ID,
        {
            description: "Author user id.",
        },
    )
    @RelationId(
        (message: ChatMessageEntity) => message.author,
    )
        authorId: string
}
