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

/**
 * One per (user, calendar day): proof that a user completed ALL of their daily
 * quest tasks that day AND claimed the reward. The row exists ONLY after a
 * successful claim, so its presence is the idempotency backstop — a second claim
 * for the same `(user_id, quest_date)` is rejected by the unique constraint.
 *
 * `quest_date` is the Asia/Ho_Chi_Minh calendar day (a `date`, no time), so a
 * user can claim once per VN day. `coin_reward` snapshots the Coin granted at
 * claim time (the catalog value can change without rewriting history).
 */
@Index(["user"])
@Unique(
    "uq_daily_quest_completions_user_id_quest_date",
    [
        "userId",
        "questDate",
    ],
)
@Entity("daily_quest_completions")
export class DailyQuestCompletionEntity extends UuidAbstractEntity {
    /** The user who completed + claimed the daily quest. */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_daily_quest_completions_users",
    })
        user: UserEntity

    /** Owning user id. */
    @Column({
        name: "user_id",
        type: "uuid",
    })
    @RelationId(
        (completion: DailyQuestCompletionEntity) => completion.user,
    )
        userId: string

    /** The Asia/Ho_Chi_Minh calendar day this quest was claimed for (YYYY-MM-DD). */
    @Column({
        name: "quest_date",
        type: "date",
    })
        questDate: string

    /** Coin granted by the claim (snapshot of the catalog value). */
    @Column({
        name: "coin_reward",
        type: "int",
    })
        coinReward: number

    /** When the claim was processed. */
    @Column({
        name: "completed_at",
        type: "timestamptz",
        default: () => "now()",
    })
        completedAt: Date
}
