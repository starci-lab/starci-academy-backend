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
    AiSubStatus,
    AiSubTier,
    GraphQLTypeAiMode,
    GraphQLTypeAiSubStatus,
    GraphQLTypeAiSubTier,
    GraphQLTypeModelProvider,
    ModelProvider,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"

/**
 * Per-user AI entitlement (1-1 with {@link UserEntity}).
 *
 * Holds both the free **Auto** allowance (counted in "lượt") and the paid
 * **Premium** credit balance, with two shared reset windows (5h + week).
 *
 * - Free / course users: `tier` is null → only the Auto allowance applies.
 * - Paid users: `tier` set → Premium credits from the tier catalog apply on
 *   top of Auto.
 * - BYOK users: `byokProvider` + `byokKeyEncrypted` set → bypass the balancer
 *   pool and quota entirely.
 *
 * Counters track usage WITHIN the current window; remaining = limit − used,
 * where the limit comes from constants (Auto) or the tier catalog (Premium).
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

    /** BYOK provider; null = not using own key. */
    @Field(
        () => GraphQLTypeModelProvider,
        {
            nullable: true,
            description: "BYOK provider; null = not using own key.",
        },
    )
    @Column({
        name: "byok_provider",
        type: "enum",
        enum: ModelProvider,
        nullable: true,
    })
        byokProvider: ModelProvider | null

    /** Encrypted user-supplied API key (BYOK); never exposed via GraphQL. */
    @Column({
        name: "byok_key_encrypted",
        type: "text",
        nullable: true,
    })
        byokKeyEncrypted: string | null

    /**
     * Lane the user chose to run on by default; null = follow the natural
     * capability order (byok → premium → auto). Validated lazily on read — a
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

    /** Auto "lượt" used in the current 5-hour window. */
    @Field(
        () => Int,
        {
            description: "Auto uses consumed in the current 5h window.",
        },
    )
    @Column({
        name: "auto_5h_used",
        type: "int",
        default: 0,
    })
        auto5hUsed: number

    /** Auto "lượt" used in the current weekly window. */
    @Field(
        () => Int,
        {
            description: "Auto uses consumed in the current weekly window.",
        },
    )
    @Column({
        name: "auto_week_used",
        type: "int",
        default: 0,
    })
        autoWeekUsed: number

    /** Premium credits consumed in the current 5-hour window. */
    @Field(
        () => Int,
        {
            description: "Premium credits consumed in the current 5h window.",
        },
    )
    @Column({
        name: "credit_5h_used",
        type: "int",
        default: 0,
    })
        credit5hUsed: number

    /** Premium credits consumed in the current weekly window. */
    @Field(
        () => Int,
        {
            description: "Premium credits consumed in the current weekly window.",
        },
    )
    @Column({
        name: "credit_week_used",
        type: "int",
        default: 0,
    })
        creditWeekUsed: number

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
