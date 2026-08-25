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
    ChatConversationEntity 
} from "./chat-conversation.entity"
import {
    UserEntity 
} from "./user.entity"

@Entity("chat_participations")
@Unique("UQ_chat_participations_conversation_user",
    ["conversation",
        "user"])
@Index("IDX_chat_participations_access",
    ["conversation",
        "accessState"])
/** Per-member access, role and in-app notification preference for Global Chat. */
export class ChatParticipationEntity extends UuidAbstractEntity {
  @ManyToOne(() => ChatConversationEntity,
      {
          onDelete: "CASCADE",
      })
  @JoinColumn({
      name: "conversation_id",
  })
      conversation: ChatConversationEntity

  @RelationId((value: ChatParticipationEntity) => value.conversation)
      conversationId: string

  @ManyToOne(() => UserEntity,
      {
          onDelete: "CASCADE",
      })
  @JoinColumn({
      name: "user_id",
  })
      user: UserEntity

  @RelationId((value: ChatParticipationEntity) => value.user)
      userId: string

  @Column({
      name: "access_state",
      type: "varchar",
      length: 16,
      default: "active",
  })
      accessState: "active" | "muted" | "banned"

  @Column({
      name: "role",
      type: "varchar",
      length: 16,
      default: "member",
  })
      role: "member" | "moderator" | "admin"

  @Column({
      name: "muted_until",
      type: "timestamptz",
      nullable: true,
  })
      mutedUntil: Date | null

  @Column({
      name: "notifications_muted",
      type: "boolean",
      default: false,
  })
      notificationsMuted: boolean
}
