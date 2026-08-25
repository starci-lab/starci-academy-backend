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

@Entity("chat_command_receipts")
@Unique("UQ_chat_command_receipts_actor_command",
    ["actor",
        "commandId"])
@Index("IDX_chat_command_receipts_created",
    ["createdAt"])
/** Actor-scoped durable idempotency receipt for retry-safe mutations. */
export class ChatCommandReceiptEntity extends UuidAbstractEntity {
  @ManyToOne(() => UserEntity,
      {
          onDelete: "CASCADE",
      })
  @JoinColumn({
      name: "actor_id",
  })
      actor: UserEntity

  @RelationId((value: ChatCommandReceiptEntity) => value.actor)
      actorId: string

  @Column({
      name: "command_id",
      type: "varchar",
      length: 128,
  })
      commandId: string

  @Column({
      name: "command_type",
      type: "varchar",
      length: 48,
  })
      commandType: string

  @Column({
      name: "response",
      type: "jsonb",
  })
      response: Record<string, unknown>
}
