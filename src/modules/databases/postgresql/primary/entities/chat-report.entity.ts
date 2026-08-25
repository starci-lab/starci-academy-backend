import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    RelationId,
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

@Entity("chat_reports")
@Index("IDX_chat_reports_reporter_message",
    ["reporter",
        "message"])
@Index("IDX_chat_reports_status_created",
    ["status",
        "createdAt"])
/** Confidential report plus reporter-local visibility state. */
export class ChatReportEntity extends UuidAbstractEntity {
  @ManyToOne(() => ChatConversationEntity,
      {
          onDelete: "CASCADE",
      })
  @JoinColumn({
      name: "conversation_id",
  })
      conversation: ChatConversationEntity

  @RelationId((value: ChatReportEntity) => value.conversation)
      conversationId: string

  @ManyToOne(() => ChatMessageEntity,
      {
          nullable: true,
          onDelete: "SET NULL",
      })
  @JoinColumn({
      name: "message_id",
  })
      message: ChatMessageEntity | null

  @RelationId((value: ChatReportEntity) => value.message)
      messageId: string | null

  @ManyToOne(() => UserEntity,
      {
          nullable: true,
          onDelete: "SET NULL",
      })
  @JoinColumn({
      name: "reported_user_id",
  })
      reportedUser: UserEntity | null

  @RelationId((value: ChatReportEntity) => value.reportedUser)
      reportedUserId: string | null

  @ManyToOne(() => UserEntity,
      {
          onDelete: "CASCADE",
      })
  @JoinColumn({
      name: "reporter_id",
  })
      reporter: UserEntity

  @RelationId((value: ChatReportEntity) => value.reporter)
      reporterId: string

  @Column({
      name: "category",
      type: "varchar",
      length: 64,
  })
      category: string

  @Column({
      name: "details",
      type: "text",
      nullable: true,
  })
      details: string | null

  @Column({
      name: "status",
      type: "varchar",
      length: 24,
      default: "open",
  })
      status: string

  @Column({
      name: "reporter_hidden",
      type: "boolean",
      default: true,
  })
      reporterHidden: boolean
}
