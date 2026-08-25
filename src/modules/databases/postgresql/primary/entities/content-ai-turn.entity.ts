import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm"
import {
    ContentAiSessionEntity 
} from "./content-ai-session.entity"

@Entity({
    name: "content_ai_turns",
})
@Index("uq_content_ai_turns_session_stream",
    ["session",
        "streamId"],
    {
        unique: true,
    })
@Index("idx_content_ai_turns_session_state",
    ["session",
        "state"])
/** Durable execution journal for idempotent Learn AI Assistant turns. */
export class ContentAiTurnEntity {
  @PrimaryGeneratedColumn("uuid")
      id: string

  @ManyToOne(() => ContentAiSessionEntity,
      {
          nullable: false,
          onDelete: "CASCADE",
      })
  @JoinColumn({
      name: "session_id",
      foreignKeyConstraintName: "fk_content_ai_turns_session_id",
  })
      session: ContentAiSessionEntity

  @Column({
      name: "session_id",
      type: "uuid",
  })
      sessionId: string

  @Column({
      name: "stream_id",
      type: "varchar",
      length: 128,
  })
      streamId: string

  @Column({
      name: "request_hash",
      type: "varchar",
      length: 64,
  })
      requestHash: string

  @Column({
      type: "varchar",
      length: 16,
      default: "processing",
  })
      state: string

  @Column({
      type: "text",
      nullable: true,
  })
      response: string | null

  @Column({
      name: "error_code",
      type: "varchar",
      length: 200,
      nullable: true,
  })
      errorCode: string | null

  @Column({
      name: "attempt_count",
      type: "integer",
      default: 1,
  })
      attemptCount: number

  @Column({
      name: "completed_at",
      type: "timestamptz",
      nullable: true,
  })
      completedAt: Date | null

  @CreateDateColumn({
      name: "created_at",
      type: "timestamptz",
  })
      createdAt: Date

  @UpdateDateColumn({
      name: "updated_at",
      type: "timestamptz",
  })
      updatedAt: Date
}
