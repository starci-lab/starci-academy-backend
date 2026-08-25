import {
    Field, ID, ObjectType 
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    RelationId,
    Unique,
} from "typeorm"
import {
    UuidAbstractEntity 
} from "./abstract"
import {
    UserEntity 
} from "./user.entity"
import {
    ChatConversationType,
    GraphQLTypeChatConversationType,
} from "../enums/chat-conversation-type"

@ObjectType({
    description: "A chat conversation (community room or founder DM).",
})
@Entity("chat_conversations")
@Unique("UQ_chat_conversations_type_member",
    ["type",
        "member"])
/**
 * A chat conversation. There is exactly one `community` conversation (the global
 * member room, `member` = null) and one `founderDm` conversation per member (the
 * owning `member`). Messages ({@link ChatMessageEntity}) hang off a conversation.
 */
export class ChatConversationEntity extends UuidAbstractEntity {
  /** Deterministic singleton key for system-owned rooms; null for founder DMs. */
  @Index("UQ_chat_conversations_room_key",
      {
          unique: true,
          where: "\"room_key\" IS NOT NULL",
      })
  @Column({
      name: "room_key",
      type: "varchar",
      length: 64,
      nullable: true,
  })
      roomKey: string | null

  /**
   * Kind of conversation (community room vs founder DM).
   */
  @Field(() => GraphQLTypeChatConversationType,
      {
          description: "Kind of conversation (community room vs founder DM).",
      })
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
  @ManyToOne(() => UserEntity,
      {
          nullable: true,
          onDelete: "CASCADE",
      })
  @JoinColumn({
      name: "member_id",
      foreignKeyConstraintName: "fk_member_id_chat_conversations_users",
  })
      member: UserEntity | null

  /**
   * Owning member id (null for the community room; denormalized via relation).
   */
  @Field(() => ID,
      {
          nullable: true,
          description: "Owning member id (null for the community room).",
      })
  @RelationId((conversation: ChatConversationEntity) => conversation.member)
      memberId: string | null
}
