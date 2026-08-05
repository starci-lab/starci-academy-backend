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
    ActivityType,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"

/**
 * The entity an activity points at, snapshotted so the feed renders a clickable
 * token without joining the target table. The route is resolved lazily at click
 * time via the route index (`resolveRoute(globalId)`), so only the identity +
 * label are stored here — never the full URL.
 */
export interface ActivityTargetRef {
    /** Target entity class name (the route-index namespace, e.g. "ContentEntity"). */
    entityName: string
    /** Target entity primary key (UUID). */
    id: string
    /** Human-readable label rendered as the token text (title / username). */
    label: string
}

/**
 * Denormalised snapshot carried on an {@link ActivityEntity} row so the home
 * feed can render text + a clickable token. The actor is the row's `user`; the
 * `target` is whatever the activity acted on (lesson/challenge/course/user…).
 */
export interface ActivityMetadata {
    /** The entity this activity points at (absent for activities with no target). */
    target?: ActivityTargetRef
}

@Unique(["type",
    "idempotencyKey"])
@Index(["user"])
@Entity("activities")
/**
 * Append-only ledger of "trend-worthy" learner activity (reads, bookmarks,
 * passes, enrolls, comments, follows). One row per event; the GitHub-style home
 * feed reads these. `(type, refId)` is unique so an event can never be recorded
 * twice (re-read lesson, re-graded attempt, re-follow), mirroring `xp_histories`.
 */
export class ActivityEntity extends UuidAbstractEntity {
    /**
     * The user who performed the activity (the feed actor).
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
        foreignKeyConstraintName: "fk_user_id_activities_users",
    })
        user: UserEntity

    /**
     * Id of the user who performed the activity.
     */
    @RelationId(
        (activity: ActivityEntity) => activity.user,
    )
        userId: string

    /**
     * Kind of activity (drives the feed phrasing).
     */
    @Column({
        name: "type",
        type: "enum",
        enum: ActivityType,
        enumName: "activity_type",
    })
        type: ActivityType

    /**
     * Scalar dedup key (NOT for parsing): a natural row id, or a synthesized
     * `dedupeKey(...)` for events with no single source row. Combined with `type`
     * it is unique, making each activity idempotent. Mirrors Job's `idempotencyKey`.
     */
    @Column({
        name: "idempotency_key",
        type: "varchar",
        length: 128,
    })
        idempotencyKey: string

    /**
     * Text-free snapshot (id-only target) for rendering the feed without joins.
     */
    @Column({
        name: "payload",
        type: "jsonb",
        nullable: true,
    })
        payload: ActivityMetadata | null
}
