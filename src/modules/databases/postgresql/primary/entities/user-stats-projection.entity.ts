import {
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryColumn,
} from "typeorm"
import {
    AbstractProjectionEntity,
} from "./abstract-projection"
import {
    UserEntity,
} from "./user.entity"
import {
    UserStatsProjectionTranslationEntity,
} from "./user-stats-projection-translation.entity"

@Entity("user_stats_projections")
/**
 * CQRS projection of a user's social + inbox counters (Type A -- single key).
 *
 * Primary key is `user_id`; the aggregate (`{ followerCount, followingCount,
 * unreadNotificationCount }`) lives in the inherited jsonb `value`. Recomputed
 * on follow/notification changes + CDC, read with a TTL lazy-refresh.
 */
export class UserStatsProjectionEntity extends AbstractProjectionEntity {
    /** Target user id -- the natural primary key (one row per user). */
    @PrimaryColumn({
        name: "user_id",
        type: "uuid",
    })
        userId: string

    /** The user this stats row belongs to (cascade-deleted with it). */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_user_id_user_stats_projections_users",
    })
        user: UserEntity

    /** Localized overrides (empty until the projection snapshots display text). */
    @OneToMany(
        () => UserStatsProjectionTranslationEntity,
        (translation: UserStatsProjectionTranslationEntity) =>
            translation.userStatsProjection,
        {
            cascade: true,
        },
    )
        translations: Array<UserStatsProjectionTranslationEntity>
}
