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
    ChatMessageEntity 
} from "./chat-message.entity"
import {
    UserEntity 
} from "./user.entity"

@Entity("chat_message_reactions")
@Unique("UQ_chat_message_reactions_message_user_emoji",
    [
        "message",
        "user",
        "emoji",
    ])
@Index("IDX_chat_message_reactions_message",
    ["message"])
/** Unique reaction membership row; aggregate counts are derived. */
export class ChatMessageReactionEntity extends UuidAbstractEntity {
  @ManyToOne(() => ChatMessageEntity,
      {
          onDelete: "CASCADE",
      })
  @JoinColumn({
      name: "message_id",
  })
      message: ChatMessageEntity

  @RelationId((value: ChatMessageReactionEntity) => value.message)
      messageId: string

  @ManyToOne(() => UserEntity,
      {
          onDelete: "CASCADE",
      })
  @JoinColumn({
      name: "user_id",
  })
      user: UserEntity

  @RelationId((value: ChatMessageReactionEntity) => value.user)
      userId: string

  @Column({
      name: "emoji",
      type: "varchar",
      length: 32,
  })
      emoji: string
}
