import {
    Column,
    Entity,
    PrimaryColumn,
} from "typeorm"

@Entity({
    schema: "public",
    name: "ai_runtime_incarnations",
})
/** Durable identity for one runtime generation of the Academy AI engine. */
export class AiRuntimeIncarnationEntity {
    @PrimaryColumn("uuid")
        id: string

    @Column({
        type: "varchar",
        length: 32,
    })
        reason: string

    @Column({
        type: "varchar",
        length: 16,
    })
        state: string

    @Column({
        name: "release_sha",
        type: "varchar",
        length: 64,
    })
        releaseSha: string

    @Column({
        name: "contract_version",
        type: "varchar",
        length: 64,
    })
        contractVersion: string

    @Column({
        name: "created_at",
        type: "timestamptz",
        default: () => "clock_timestamp()",
    })
        createdAt: Date

    @Column({
        name: "activated_at",
        type: "timestamptz",
        nullable: true,
    })
        activatedAt: Date | null

    @Column({
        name: "retired_at",
        type: "timestamptz",
        nullable: true,
    })
        retiredAt: Date | null
}
