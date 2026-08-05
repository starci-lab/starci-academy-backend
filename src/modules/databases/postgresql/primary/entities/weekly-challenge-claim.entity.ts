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

@Index(["user"])
@Unique(
    "uq_weekly_challenge_claims_user_week",
    [
        "userId",
        "weekStartAt",
    ],
)
@Entity("weekly_challenge_claims")
/**
 * One per (user, ISO week): proof that a user claimed the coin reward for
 * passing that week's auto-rotated weekly-challenge event. The row exists ONLY
 * after a successful claim, so its presence is the idempotency backstop — a
 * second claim for the same `(user_id, week_start_at)` is rejected by the
 * unique constraint. `week_start_at` uses the SAME ISO-week boundary
 * (`date_trunc('week', now())`) as `WeeklyChallengeService.getWeeklyChallenge`'s
 * `weekEndAt`, so the leaderboard window and the claim window can never drift
 * apart. `coin_reward` snapshots the catalog value at claim time.
 */
export class WeeklyChallengeClaimEntity extends UuidAbstractEntity {
    /** The user who claimed the reward. */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_weekly_challenge_claims_users",
    })
        user: UserEntity

    /** Owning user id. */
    @Column({
        name: "user_id",
        type: "uuid",
    })
    @RelationId(
        (claim: WeeklyChallengeClaimEntity) => claim.user,
    )
        userId: string

    /** The challenge that was passed + claimed for this week. */
    @Column({
        name: "challenge_id",
        type: "uuid",
    })
        challengeId: string

    /** Start of the ISO week this claim covers (Monday 00:00). */
    @Column({
        name: "week_start_at",
        type: "timestamptz",
    })
        weekStartAt: Date

    /** Coin granted by the claim (snapshot of the catalog value). */
    @Column({
        name: "coin_reward",
        type: "int",
    })
        coinReward: number

    /** When the claim was processed. */
    @Column({
        name: "claimed_at",
        type: "timestamptz",
        default: () => "now()",
    })
        claimedAt: Date
}
