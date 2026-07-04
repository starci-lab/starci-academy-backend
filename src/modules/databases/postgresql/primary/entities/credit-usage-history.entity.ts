import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    RelationId,
} from "typeorm"
import {
    AiCeilSurface,
    AiMode,
    AiModelTask,
    GraphQLTypeAiCeilSurface,
    GraphQLTypeAiMode,
    GraphQLTypeAiModelTask,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"

/**
 * Audit row recording one AI credit charge — written ATOMICALLY by
 * {@link AiEntitlementService.consume} alongside the unified pool debit (same
 * transaction, same source of truth as the quota gate), so this ledger can
 * never drift from `ai_subscriptions.credit5hUsed/creditWeekUsed`.
 *
 * Not tied to any specific attempt/submission row (deliberately — a charge can
 * happen before that row exists, e.g. at grade-time before the attempt is
 * persisted) — correlate by `userId` + `createdAt` + `surface`/`task` instead.
 */
@ObjectType({
    description: "One AI credit charge, recorded atomically with the unified pool debit.",
})
@Entity("credit_usage_histories")
export class CreditUsageHistoryEntity extends UuidAbstractEntity {
    /**
     * User the credits were charged to.
     */
    @Field(
        () => UserEntity,
        {
            description: "User the credits were charged to.",
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
        foreignKeyConstraintName: "fk_user_id_credit_usage_histories_users",
    })
        user: UserEntity

    /**
     * User ID the credits were charged to.
     */
    @Field(
        () => ID,
        {
            description: "User ID the credits were charged to.",
        },
    )
    @RelationId(
        (creditUsageHistory: CreditUsageHistoryEntity) => creditUsageHistory.user,
    )
        userId: string

    /**
     * AI lane used for the run (auto / premium).
     */
    @Field(
        () => GraphQLTypeAiMode,
        {
            description: "AI lane used for the run (auto / premium).",
        },
    )
    @Column({
        name: "mode",
        type: "enum",
        enum: AiMode,
        enumName: "ai_mode",
    })
        mode: AiMode

    /**
     * AI surface (chatbot / grading / interview) that triggered this charge.
     */
    @Field(
        () => GraphQLTypeAiCeilSurface,
        {
            description: "AI surface (chatbot / grading / interview) that triggered this charge.",
        },
    )
    @Column({
        name: "surface",
        type: "enum",
        enum: AiCeilSurface,
        enumName: "ai_ceil_surface",
    })
        surface: AiCeilSurface

    /**
     * Finer-grained task (challenge grading / task grading / cv generating /
     * chatting / …) than {@link surface} — null for charges recorded before this
     * column existed or where the caller didn't have a task to attribute.
     */
    @Field(
        () => GraphQLTypeAiModelTask,
        {
            nullable: true,
            description: "Finer-grained AI task than surface (e.g. challenge_grading vs task_grading).",
        },
    )
    @Column({
        name: "task",
        type: "enum",
        enum: AiModelTask,
        enumName: "ai_model_task",
        nullable: true,
    })
        task: AiModelTask | null

    /**
     * Model recommendation tier billed (low / medium / high); null for auto.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Model recommendation tier billed (low / medium / high); null for auto.",
        },
    )
    @Column({
        name: "recommendation",
        type: "varchar",
        length: 16,
        nullable: true,
    })
        recommendation: string | null

    /**
     * Concrete model billed (e.g. "gpt-5-mini" / "gemini-2.5-flash"); null when
     * the caller had no served-model attribution.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Concrete model billed (e.g. gpt-5-mini); null when unattributed.",
        },
    )
    @Column({
        name: "model",
        type: "varchar",
        length: 64,
        nullable: true,
    })
        model: string | null

    /**
     * Provider of the billed model (gemini / openai); null when unattributed.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Provider of the billed model (gemini / openai); null when unattributed.",
        },
    )
    @Column({
        name: "provider",
        type: "varchar",
        length: 32,
        nullable: true,
    })
        provider: string | null

    /**
     * Number of credits charged for this run.
     */
    @Field(
        () => Int,
        {
            description: "Number of credits charged for this run.",
        },
    )
    @Column({
        name: "credits",
        type: "int",
        default: 0,
    })
        credits: number

    /**
     * Prompt (input) tokens the model consumed, when known.
     */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Prompt (input) tokens the model consumed, when known.",
        },
    )
    @Column({
        name: "prompt_tokens",
        type: "int",
        nullable: true,
    })
        promptTokens: number | null

    /**
     * Completion (output) tokens the model produced, when known.
     */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Completion (output) tokens the model produced, when known.",
        },
    )
    @Column({
        name: "completion_tokens",
        type: "int",
        nullable: true,
    })
        completionTokens: number | null

    /**
     * Number of attempts the balancer needed to get a usable response
     * (retries on a failed/empty completion), when known.
     */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Number of balancer attempts needed to get a usable response, when known.",
        },
    )
    @Column({
        name: "attempts",
        type: "int",
        nullable: true,
    })
        attempts: number | null
}
