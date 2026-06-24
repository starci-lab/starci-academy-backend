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
    AiMode,
    GraphQLTypeAiMode,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"
import {
    UserChallengeSubmissionAttemptEntity,
} from "./user-challenge-submission-attempt.entity"

/**
 * Audit row recording the AI credits charged to a user for one grading run.
 * Written after a challenge submission is graded.
 */
@ObjectType({
    description: "AI credit charge recorded after a challenge submission is graded.",
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
     * Challenge submission attempt that triggered the charge, or null when the
     * AI grading run is not tied to a challenge attempt (e.g. interview practice).
     */
    @Field(
        () => UserChallengeSubmissionAttemptEntity,
        {
            nullable: true,
            description: "Challenge submission attempt that triggered the charge; null for non-challenge AI grading.",
        },
    )
    @ManyToOne(
        () => UserChallengeSubmissionAttemptEntity,
        {
            onDelete: "CASCADE",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "user_challenge_submission_attempt_id",
        foreignKeyConstraintName:
            "fk_attempt_id_credit_usage_histories_attempts",
    })
        attempt: UserChallengeSubmissionAttemptEntity | null

    /**
     * Attempt ID that triggered the charge, or null for non-challenge AI grading.
     */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Attempt ID that triggered the charge; null for non-challenge AI grading.",
        },
    )
    @RelationId(
        (creditUsageHistory: CreditUsageHistoryEntity) => creditUsageHistory.attempt,
    )
        attemptId: string | null

    /**
     * AI lane used for the grading (auto / premium / byok).
     */
    @Field(
        () => GraphQLTypeAiMode,
        {
            description: "AI lane used for the grading (auto / premium / byok).",
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
     * Model recommendation tier billed (low / medium / high); null for auto / byok.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Model recommendation tier billed (low / medium / high); null for auto / byok.",
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
     * Concrete model billed (e.g. "gpt-5-mini" / "gemini-2.5-flash"); null for the free Auto lane
     * where the balancer picks a complimentary model.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Concrete model billed (e.g. gpt-5-mini); null for the free Auto lane.",
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
     * Provider of the billed model (gemini / openai); null for the free Auto lane.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Provider of the billed model (gemini / openai); null for the free Auto lane.",
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
     * Number of credits charged for this grading run.
     */
    @Field(
        () => Int,
        {
            description: "Number of credits charged for this grading run.",
        },
    )
    @Column({
        name: "credits",
        type: "int",
        default: 0,
    })
        credits: number
}
