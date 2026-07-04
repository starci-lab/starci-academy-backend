import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
} from "typeorm"
import {
    AiMode,
    AiModelCategory,
    AiSubStatus,
    AiSubTier,
    GraphQLTypeAiMode,
    GraphQLTypeAiSubStatus,
    GraphQLTypeAiSubTier,
} from "../enums"

/**
 * Per-surface AI model CEILING overrides ("trần" the user sets in settings).
 * `default` caps every surface; a surface key (chatbot/grading/interview)
 * overrides the default for that surface. Absent key = inherit default; absent
 * default = only the plan ceiling caps. The Auto chain never climbs past the
 * resolved ceiling. Stored as jsonb on the subscription row.
 */
export interface AiCeilOverrides {
    /** Global default ceiling for every surface. */
    default?: AiModelCategory
    /** Hỏi AI khi đọc bài. */
    chatbot?: AiModelCategory
    /** Chấm bài (challenge + capstone). */
    grading?: AiModelCategory
    /** Phỏng vấn thử. */
    interview?: AiModelCategory
}
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"

/**
 * Per-user AI entitlement (1-1 with {@link UserEntity}).
 *
 * Holds a single **credit** pool spent by every run, with two shared
 * reset windows (5h + week).
 *
 * - Free / course users: `tier` is null → allowance = the free base credits.
 * - Paid users: `tier` set → allowance = free base + the tier catalog credits.
 *   A tier also unlocks the higher model categories (free = Economy only).
 *
 * Counters track credits spent WITHIN the current window; remaining = limit −
 * used, where the limit = free base + (tier catalog credits when subscribed).
 */
@ObjectType({
    description: "Per-user AI entitlement: Auto allowance + Premium credits.",
})
@Entity("ai_subscriptions")
export class AiSubscriptionEntity extends UuidAbstractEntity {
    /** Paid tier; null = free (Auto only). */
    @Field(
        () => GraphQLTypeAiSubTier,
        {
            nullable: true,
            description: "Paid subscription tier; null = free/Auto only.",
        },
    )
    @Column({
        name: "tier",
        type: "enum",
        enum: AiSubTier,
        nullable: true,
    })
        tier: AiSubTier | null

    /** Lifecycle status of the paid subscription. */
    @Field(
        () => GraphQLTypeAiSubStatus,
        {
            description: "Lifecycle status of the subscription.",
        },
    )
    @Column({
        name: "status",
        type: "enum",
        enum: AiSubStatus,
        enumName: "ai_sub_status",
        default: AiSubStatus.Active,
    })
        status: AiSubStatus

    /** End of the current paid billing period; null when on free tier. */
    @Field(
        () => Date,
        {
            nullable: true,
            description: "End of current paid billing period.",
        },
    )
    @Column({
        name: "current_period_end",
        type: "timestamptz",
        nullable: true,
    })
        currentPeriodEnd: Date | null

    /** Whether the paid subscription auto-renews at period end. */
    @Field(
        () => Boolean,
        {
            description: "Whether the subscription auto-renews.",
        },
    )
    @Column({
        name: "auto_renew",
        type: "boolean",
        default: false,
    })
        autoRenew: boolean

    /**
     * Lane the user chose to run on by default; null = follow the natural
     * capability order (premium → auto). Validated lazily on read — a
     * preferred lane the user is no longer entitled to silently falls back to
     * the natural mode.
     */
    @Field(
        () => GraphQLTypeAiMode,
        {
            nullable: true,
            description: "User's chosen default AI lane; null = natural order.",
        },
    )
    @Column({
        name: "preferred_mode",
        type: "enum",
        enum: AiMode,
        enumName: "ai_mode",
        nullable: true,
    })
        preferredMode: AiMode | null

    /** Timestamp when the 5-hour usage window resets. */
    @Column({
        name: "window_5h_reset_at",
        type: "timestamptz",
        nullable: true,
    })
        window5hResetAt: Date | null

    /** Timestamp when the weekly usage window resets. */
    @Column({
        name: "window_week_reset_at",
        type: "timestamptz",
        nullable: true,
    })
        windowWeekResetAt: Date | null

    /**
     * Platform credits consumed in the current 5-hour window. Single unified
     * pool for every run (free + paid); allowance = free base + tier.
     */
    @Field(
        () => Int,
        {
            description: "Platform credits consumed in the current 5h window.",
        },
    )
    @Column({
        name: "credit_5h_used",
        type: "int",
        default: 0,
    })
        credit5hUsed: number

    /** Platform credits consumed in the current weekly window. */
    @Field(
        () => Int,
        {
            description: "Platform credits consumed in the current weekly window.",
        },
    )
    @Column({
        name: "credit_week_used",
        type: "int",
        default: 0,
    })
        creditWeekUsed: number

    /**
     * Per-surface model CEILING overrides the user set in AI settings (cost
     * control). jsonb `{ default?, chatbot?, grading?, interview? }` of
     * {@link AiModelCategory}. Null = no caps (only the plan ceiling applies).
     * Not exposed directly via GraphQL — surfaced through the quota query.
     */
    @Column({
        name: "ceil_overrides",
        type: "jsonb",
        nullable: true,
    })
        ceilOverrides: AiCeilOverrides | null

    /** The user this entitlement belongs to. */
    @OneToOne(
        () => UserEntity,
        (user: UserEntity) => user.aiSubscription,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_user_id_ai_subscriptions_users",
    })
        user: UserEntity
}
