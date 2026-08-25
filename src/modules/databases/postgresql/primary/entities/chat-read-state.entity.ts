import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    RelationId,
    Unique,
} from "typeorm"
import {
    UuidAbstractEntity 
} from "./abstract"
import {
    ChatConversationEntity 
} from "./chat-conversation.entity"
import {
    ChatMessageEntity 
} from "./chat-message.entity"
import {
    UserEntity 
} from "./user.entity"

@Entity("chat_read_states")
@Unique("UQ_chat_read_states_conversation_user",
    ["conversation",
        "user"])
/** Monotonic per-member read anchor for unread and mention continuity. */
export class ChatReadStateEntity extends UuidAbstractEntity {
  @ManyToOne(() => ChatConversationEntity,
      {
          onDelete: "CASCADE",
      })
  @JoinColumn({
      name: "conversation_id",
  })
      conversation: ChatConversationEntity

  @RelationId((value: ChatReadStateEntity) => value.conversation)
      conversationId: string

  @ManyToOne(() => UserEntity,
      {
          onDelete: "CASCADE",
      })
  @JoinColumn({
      name: "user_id",
  })
      user: UserEntity

  @RelationId((value: ChatReadStateEntity) => value.user)
      userId: string

  @ManyToOne(() => ChatMessageEntity,
      {
          nullable: true,
          onDelete: "SET NULL",
      })
  @JoinColumn({
      name: "last_read_message_id",
  })
      lastReadMessage: ChatMessageEntity | null

  @RelationId((value: ChatReadStateEntity) => value.lastReadMessage)
      lastReadMessageId: string | null

  @Column({
      name: "last_read_at",
      type: "timestamptz",
      nullable: true,
  })
      lastReadAt: Date | null
}
