import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    RelationId,
    Unique,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"
import {
    ChatConversationType,
    GraphQLTypeChatConversationType,
} from "../enums"

/**
 * A chat conversation. There is exactly one `community` conversation (the global
 * member room, `member` = null) and one `founderDm` conversation per member (the
 * owning `member`). Messages ({@link ChatMessageEntity}) hang off a conversation.
 */
@ObjectType({
    description: "A chat conversation (community room or founder DM).",
})
@Entity("chat_conversations")
@Unique(
    "UQ_chat_conversations_type_member",
    [
        "type",
        "member",
    ],
)
export class ChatConversationEntity extends UuidAbstractEntity {
    /**
     * Kind of conversation (community room vs founder DM).
     */
    @Field(
        () => GraphQLTypeChatConversationType,
        {
            description: "Kind of conversation (community room vs founder DM).",
        },
    )
    @Column({
        name: "type",
        type: "enum",
        enum: ChatConversationType,
        enumName: "chat_conversation_type",
    })
        type: ChatConversationType

    /**
     * Owning member for a founder DM; null for the global community room.
     */
    @ManyToOne(
        () => UserEntity,
        {
            nullable: true,
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "member_id",
        foreignKeyConstraintName: "fk_member_id_chat_conversations_users",
    })
        member: UserEntity | null

    /**
     * Owning member id (null for the community room; denormalized via relation).
     */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Owning member id (null for the community room).",
        },
    )
    @RelationId(
        (conversation: ChatConversationEntity) => conversation.member,
    )
        memberId: string | null
}
