import {
    Column,
    Entity,
    PrimaryColumn,
} from "typeorm"

@Entity({
    schema: "public",
    name: "ai_runtime_control",
})
/** Singleton switch selecting the active runtime incarnation and admission state. */
export class AiRuntimeControlEntity {
    @PrimaryColumn("smallint")
        id: number

    @Column({
        name: "active_incarnation_id",
        type: "uuid",
    })
        activeIncarnationId: string

    @Column({
        type: "boolean",
        default: false,
    })
        accepting: boolean

    @Column({
        type: "bigint",
        default: 0,
    })
        version: string

    @Column({
        name: "created_at",
        type: "timestamptz",
        default: () => "clock_timestamp()",
    })
        createdAt: Date

    @Column({
        name: "updated_at",
        type: "timestamptz",
        default: () => "clock_timestamp()",
    })
        updatedAt: Date
}
