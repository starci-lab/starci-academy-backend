import {
    Column, Entity, Index, Unique 
} from "typeorm"
import {
    UuidAbstractEntity 
} from "./abstract"

@Entity("chat_outbox")
@Unique("UQ_chat_outbox_event_key",
    ["eventKey"])
@Index("IDX_chat_outbox_pending",
    ["publishedAt",
        "availableAt",
        "createdAt"])
/** Durable compact invalidation queued in the same transaction as canonical state. */
export class ChatOutboxEntity extends UuidAbstractEntity {
  @Column({
      name: "event_key",
      type: "varchar",
      length: 160,
  })
      eventKey: string

  @Column({
      name: "event_type",
      type: "varchar",
      length: 48,
  })
      eventType: string

  @Column({
      name: "aggregate_id",
      type: "uuid",
  })
      aggregateId: string

  @Column({
      name: "payload",
      type: "jsonb",
  })
      payload: Record<string, unknown>

  @Column({
      name: "available_at",
      type: "timestamptz",
      default: () => "CURRENT_TIMESTAMP",
  })
      availableAt: Date

  @Column({
      name: "published_at",
      type: "timestamptz",
      nullable: true,
  })
      publishedAt: Date | null

  @Column({
      name: "locked_at",
      type: "timestamptz",
      nullable: true,
  })
      lockedAt: Date | null

  @Column({
      name: "attempts",
      type: "int",
      default: 0,
  })
      attempts: number

  @Column({
      name: "last_error",
      type: "text",
      nullable: true,
  })
      lastError: string | null
}
