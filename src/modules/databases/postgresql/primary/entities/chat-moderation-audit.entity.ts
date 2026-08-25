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
    ChatModerationCaseEntity 
} from "./chat-moderation-case.entity"
import {
    UserEntity 
} from "./user.entity"

@Entity("chat_moderation_audits")
@Index("IDX_chat_moderation_audits_case_created",
    [
        "moderationCase",
        "createdAt",
    ])
/** Append-only reason-required audit row for every moderation decision. */
export class ChatModerationAuditEntity extends UuidAbstractEntity {
  @ManyToOne(() => ChatModerationCaseEntity,
      {
          onDelete: "CASCADE",
      })
  @JoinColumn({
      name: "case_id",
  })
      moderationCase: ChatModerationCaseEntity

  @RelationId((value: ChatModerationAuditEntity) => value.moderationCase)
      caseId: string

  @ManyToOne(() => UserEntity,
      {
          nullable: true,
          onDelete: "SET NULL",
      })
  @JoinColumn({
      name: "actor_id",
  })
      actor: UserEntity | null

  @RelationId((value: ChatModerationAuditEntity) => value.actor)
      actorId: string | null

  @Column({
      name: "action",
      type: "varchar",
      length: 32,
  })
      action: string

  @Column({
      name: "reason",
      type: "text",
  })
      reason: string

  @Column({
      name: "metadata",
      type: "jsonb",
      default: {
      },
  })
      metadata: Record<string, unknown>
}
