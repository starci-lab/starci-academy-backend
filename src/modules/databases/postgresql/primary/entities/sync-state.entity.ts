import {
    Column,
    Entity,
    Index,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    SyncStateSourceType,
    SyncStateStatus,
    SyncStateTarget,
} from "../enums/sync-state"

@Entity("sync_states")
@Index("ux_sync_state_target_source",
    ["target",
        "sourceType",
        "sourceId"],
    {
        unique: true 
    })
@Index("ix_sync_state_status_next_retry",
    ["status",
        "nextRetryAt"])
export class SyncStateEntity extends UuidAbstractEntity {
    @Column({
        name: "target",
        type: "varchar",
    })
        target: SyncStateTarget

    @Column({
        name: "source_type",
        type: "varchar",
    })
        sourceType: SyncStateSourceType

    @Column({
        name: "source_id",
        type: "uuid",
    })
        sourceId: string

    @Column({
        name: "source_updated_at",
        type: "timestamptz",
    })
        sourceUpdatedAt: Date

    @Column({
        name: "status",
        type: "varchar",
        default: SyncStateStatus.Pending,
    })
        status: SyncStateStatus

    @Column({
        name: "synced_at",
        type: "timestamptz",
        nullable: true,
    })
        syncedAt: Date | null

    @Column({
        name: "retry_count",
        type: "int",
        default: 0,
    })
        retryCount: number

    @Column({
        name: "last_error",
        type: "text",
        nullable: true,
    })
        lastError: string | null

    @Column({
        name: "next_retry_at",
        type: "timestamptz",
        nullable: true,
    })
        nextRetryAt: Date | null
}
