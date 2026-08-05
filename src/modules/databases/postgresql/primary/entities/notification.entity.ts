import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    RelationId,
} from "typeorm"
import {
    NotificationType,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"

/**
 * Where a notification points, snapshotted so the bell list renders a clickable
 * token without joining the source table. The concrete route is resolved lazily
 * at click time from `entityName` + `id`; only the identity + label are stored.
 */
export interface NotificationTargetRef {
    /** Target entity class name (the route-index namespace, e.g. "ChallengeSubmissionEntity"). */
    entityName: string
    /** Target entity primary key (UUID). */
    id: string
    /** Human-readable label rendered as the token text (title / username). */
    label: string
}

/**
 * Denormalised snapshot carried on a {@link NotificationEntity} row so the bell
 * list can render text + an optional clickable destination without deep joins.
 */
export interface NotificationI18nText {
    /** i18n message key (e.g. "noti.challengeGraded.title"). */
    key: string
    /** Interpolation values for the key (counts, names, token labels). */
    params?: Record<string, string>
}

/**
 * Jsonb blob on a {@link NotificationEntity} so the bell list can render i18n
 * title/body plus an optional click target without joining the source table.
 */
export interface NotificationMetadata {
    /** Headline, rendered via i18n (key + params) -- no stored text. */
    title: NotificationI18nText
    /** Optional supporting line, rendered via i18n; omit when title is enough. */
    body?: NotificationI18nText
    /** The entity this notification points at (absent for targetless messages). */
    target?: NotificationTargetRef
}

@Index(["user",
    "readAt"])
@Index(["user"])
@Entity("notifications")
/**
 * A single in-app notification delivered to one recipient (`user`). Unlike the
 * public {@link ActivityEntity} feed, this row is private and carries a read
 * lifecycle: `readAt` is null while unread and stamped when the recipient reads
 * it. The bell dropdown lists these newest-first; the unread badge counts the
 * `readAt IS NULL` rows. The composite `(user, readAt)` index keeps both the
 * unread count and the unread-only listing cheap.
 */
export class NotificationEntity extends UuidAbstractEntity {
    /**
     * The recipient the notification is delivered to.
     */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_notifications_users",
    })
        user: UserEntity

    /**
     * Id of the recipient (read-only virtual column synced from the relation).
     */
    @RelationId(
        (notification: NotificationEntity) => notification.user,
    )
        userId: string

    /**
     * Kind of notification (drives the icon + phrasing on the FE).
     */
    @Column({
        name: "type",
        type: "enum",
        enum: NotificationType,
        enumName: "notification_type",
    })
        type: NotificationType

    /**
     * Text-free snapshot: title/body i18n descriptors + optional clickable target.
     */
    @Column({
        name: "payload",
        type: "jsonb",
        nullable: true,
    })
        payload: NotificationMetadata | null

    /**
     * When the recipient read the notification; null while still unread. Drives
     * the unread badge (`readAt IS NULL`) and the read/unread filter.
     */
    @Column({
        name: "read_at",
        type: "timestamptz",
        nullable: true,
    })
        readAt: Date | null
}
