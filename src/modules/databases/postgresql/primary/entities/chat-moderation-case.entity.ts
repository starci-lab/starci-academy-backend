import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity 
} from "./abstract"
import {
    ChatReportEntity 
} from "./chat-report.entity"
import {
    UserEntity 
} from "./user.entity"

@Entity("chat_moderation_cases")
/** Versioned moderation workflow with an immutable intake evidence snapshot. */
export class ChatModerationCaseEntity extends UuidAbstractEntity {
  @OneToOne(() => ChatReportEntity,
      {
          onDelete: "CASCADE",
      })
  @JoinColumn({
      name: "report_id",
  })
      report: ChatReportEntity

  @RelationId((value: ChatModerationCaseEntity) => value.report)
      reportId: string

  @ManyToOne(() => UserEntity,
      {
          nullable: true,
          onDelete: "SET NULL",
      })
  @JoinColumn({
      name: "assignee_id",
  })
      assignee: UserEntity | null

  @RelationId((value: ChatModerationCaseEntity) => value.assignee)
      assigneeId: string | null

  @Column({
      name: "status",
      type: "varchar",
      length: 24,
      default: "open",
  })
      status: string

  @Column({
      name: "outcome",
      type: "varchar",
      length: 32,
      nullable: true,
  })
      outcome: string | null

  @Column({
      name: "reason",
      type: "text",
      nullable: true,
  })
      reason: string | null

  @Column({
      name: "evidence",
      type: "jsonb",
  })
      evidence: Record<string, unknown>

  @Column({
      name: "version",
      type: "int",
      default: 1,
  })
      version: number

  @Column({
      name: "resolved_at",
      type: "timestamptz",
      nullable: true,
  })
      resolvedAt: Date | null
}
