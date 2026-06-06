import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    RelationId,
    Unique,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"

/**
 * A device/browser a user has authenticated from, identified by its
 * client-generated fingerprint. Used for audit and anti-cheat correlation
 * (which IPs/devices a user submits from). One row per (user, fingerprint);
 * `lastSeenAt` is bumped on each login from that device.
 */
@Entity("devices")
@Unique(
    "UQ_devices_user_fingerprint",
    [
        "user",
        "fingerprint",
    ],
)
export class DeviceEntity extends UuidAbstractEntity {
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_devices_users",
    })
        user: UserEntity

    @RelationId(
        (device: DeviceEntity) => device.user,
    )
        userId: string

    @Column({
        name: "fingerprint",
        type: "varchar",
        length: 256,
    })
        fingerprint: string

    @Column({
        name: "user_agent",
        type: "varchar",
        length: 512,
        nullable: true,
    })
        userAgent: string | null

    @Column({
        name: "ip_address",
        type: "varchar",
        length: 64,
        nullable: true,
    })
        ipAddress: string | null

    @Column({
        name: "last_seen_at",
        type: "timestamptz",
        default: () => "NOW()",
    })
        lastSeenAt: Date

    @Column({
        name: "trusted",
        type: "boolean",
        default: false,
    })
        trusted: boolean
}
