import {
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
    ChatMessageEntity 
} from "./chat-message.entity"
import {
    UserEntity 
} from "./user.entity"

@Entity("chat_message_mentions")
@Unique("UQ_chat_message_mentions_message_user",
    ["message",
        "user"])
@Index("IDX_chat_message_mentions_user",
    ["user",
        "createdAt"])
/** Explicit mention membership used by unread indicators. */
export class ChatMessageMentionEntity extends UuidAbstractEntity {
  @ManyToOne(() => ChatMessageEntity,
      {
          onDelete: "CASCADE",
      })
  @JoinColumn({
      name: "message_id",
  })
      message: ChatMessageEntity

  @RelationId((value: ChatMessageMentionEntity) => value.message)
      messageId: string

  @ManyToOne(() => UserEntity,
      {
          onDelete: "CASCADE",
      })
  @JoinColumn({
      name: "user_id",
  })
      user: UserEntity

  @RelationId((value: ChatMessageMentionEntity) => value.user)
      userId: string
}
