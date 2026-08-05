import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
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
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"
import {
    AchievementEntity,
} from "./achievement.entity"

@ObjectType({
    description: "Record of an achievement (and tier) earned by a user.",
})
// idempotency: one row per user x achievement x tier reached
@Unique("UQ_user_achievement_user_achievement_tier",
    ["user",
        "achievement",
        "tier"])
// profile read filters by user
@Index(["user"])
@Entity("user_achievements")
/**
 * Append-only ledger of achievements a user has earned. One row per
 * `(user, achievement, tier)` so a tiered badge produces one row per tier
 * reached, and `earnedAt` for each is captured exactly once.
 *
 * `(user, achievement, tier)` is unique so the idempotent award INSERT (run by
 * the recompute path on every relevant event) can never double-record the same
 * milestone. A single-tier achievement stores `tier = null`.
 */
export class UserAchievementEntity extends UuidAbstractEntity {
    /**
     * User who earned the achievement.
     */
    @Field(
        () => UserEntity,
        {
            description: "User who earned the achievement.",
        },
    )
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_user_achievements_users",
    })
        user: UserEntity

    /**
     * User ID who earned the achievement.
     */
    @Field(
        () => ID,
        {
            description: "User ID who earned the achievement.",
        },
    )
    @RelationId(
        (userAchievement: UserAchievementEntity) => userAchievement.user,
    )
        userId: string

    /**
     * The achievement definition that was earned.
     */
    @Field(
        () => AchievementEntity,
        {
            description: "The achievement definition that was earned.",
        },
    )
    @ManyToOne(
        () => AchievementEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "achievement_id",
        foreignKeyConstraintName: "fk_achievement_id_user_achievements_achievements",
    })
        achievement: AchievementEntity

    /**
     * Achievement ID that was earned.
     */
    @Field(
        () => ID,
        {
            description: "Achievement ID that was earned.",
        },
    )
    @RelationId(
        (userAchievement: UserAchievementEntity) => userAchievement.achievement,
    )
        achievementId: string

    /**
     * Tier reached for a tiered achievement (1-based index into the definition's
     * `tierThresholds`); null for a single-tier achievement. Part of the unique
     * key so each tier is recorded once.
     */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Tier reached (1-based) for a tiered achievement; null when single-tier.",
        },
    )
    @Column({
        name: "tier",
        type: "int",
        nullable: true,
    })
        tier: number | null

    /**
     * When this achievement (tier) was first earned.
     */
    @Field(
        () => Date,
        {
            description: "When this achievement (tier) was first earned.",
        },
    )
    @Column({
        name: "earned_at",
        type: "timestamptz",
        default: () => "now()",
    })
        earnedAt: Date
}
