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
    OneToMany,
    RelationId,
    Unique,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserChallengeSubmissionEntity,
} from "./user-challenge-submission.entity"
import {
    UserChallengeSubmissionFeedbackEntity,
} from "./user-challenge-submission-feedback.entity"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums/locale"

@ObjectType({
    description: "A single attempt of a user challenge submission.",
})
@Unique(["idempotencyKey"])
@Entity("user_challenge_submission_attempts")
/**
 * One grading outcome for one job (`idempotencyKey` = job id). A retried job
 * reusing the key must hit the unique constraint instead of granting a second
 * score / XP.
 */
export class UserChallengeSubmissionAttemptEntity extends UuidAbstractEntity {
    /** Logical whole-attempt identity shared by every authored deliverable snapshot. */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Logical whole-Challenge attempt identity shared by its deliverables.",
        },
    )
    @Column({
        name: "attempt_group_id",
        type: "uuid",
        nullable: true,
    })
        attemptGroupId: string | null

    /**
     * Idempotency key (= grading job id) -- one attempt per grading job. A retried
     * job re-inserting with the same key hits this unique constraint, so the
     * complete step treats it as already-done instead of creating a duplicate.
     */
    @Column({
        name: "idempotency_key",
        type: "varchar",
        length: 64,
        nullable: true,
    })
        idempotencyKey: string | null

    /** Public evaluation job identity used to resume a queued or failed evaluation. */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Durable grading job identity for this attempt.",
        },
    )
    get evaluationJobId(): string | null {
        return this.idempotencyKey
    }

    /** Platform-owned lifecycle; AI output cannot write this field directly. */
    @Field(
        () => String,
        {
            description: "Platform-owned attempt lifecycle status.",
        },
    )
    @Column({
        name: "status",
        type: "varchar",
        length: 32,
        default: "evaluating",
    })
        status: "evaluating" | "passed" | "needs_revision" | "evaluation_unavailable" | "completed"

    /** Draft revision snapshotted by this immutable attempt. */
    @Field(
        () => Int,
        {
            description: "Draft revision snapshotted at submission time.",
        },
    )
    @Column({
        name: "draft_revision",
        type: "int",
        default: 0,
    })
        draftRevision: number

    /** Time the immutable attempt entered evaluation. */
    @Field(
        () => Date,
        {
            description: "When the attempt was submitted for evaluation.",
        },
    )
    @Column({
        name: "submitted_at",
        type: "timestamptz",
        default: () => "CURRENT_TIMESTAMP",
    })
        submittedAt: Date

    /** Server-authoritative result, absent while evaluating or unavailable. */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Platform decision derived from validated evidence.",
        },
    )
    @Column({
        name: "platform_decision",
        type: "varchar",
        length: 32,
        nullable: true,
    })
        platformDecision: "passed" | "needs_revision" | null

    /** Confidence of the validated advisory evidence, not of the final platform policy. */
    @Field(
        () => Number,
        {
            nullable: true,
            description: "Confidence assigned to the validated advisory evidence.",
        },
    )
    @Column({
        name: "confidence",
        type: "double precision",
        nullable: true,
    })
        confidence: number | null

    /** Learner-safe explanation when evidence is incomplete or evaluation is unavailable. */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Learner-safe uncertainty or unavailability explanation.",
        },
    )
    @Column({
        name: "uncertainty",
        type: "text",
        nullable: true,
    })
        uncertainty: string | null

    /** Concrete next learning action owned by platform policy. */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Concrete next action for the learner.",
        },
    )
    @Column({
        name: "next_action",
        type: "text",
        nullable: true,
    })
        nextAction: string | null

    /** Monotonic once-only finalization revision. */
    @Field(
        () => Int,
        {
            description: "Monotonic result finalization revision.",
        },
    )
    @Column({
        name: "finalization_revision",
        type: "int",
        default: 0,
    })
        finalizationRevision: number

    /** Structured advisory evidence retained for audit; intentionally not exposed wholesale. */
    @Column({
        name: "ai_advisory_evidence",
        type: "jsonb",
        nullable: true,
    })
        aiAdvisoryEvidence: Record<string, unknown> | null

    @Field(
        () => Int,
        {
            description: "The sequence number of this attempt for this requirement.",
        },
    )
    @Column({
        name: "attempt_number",
        type: "int",
    })
        attemptNumber: number

    @Field(
        () => Int,
        {
            description: "Score achieved in this attempt.",
            nullable: true,
        },
    )
    @Column({
        name: "score",
        type: "int",
        nullable: true,
    })
        score: number | null

    @Field(
        () => String,
        {
            description: "Feedback summary for this attempt.",
            nullable: true,
        },
    )
    @Column({
        name: "short_feedback",
        type: "text",
        nullable: true,
    })
        shortFeedback: string | null

    @Field(
        () => Date,
        {
            description: "When the attempt was finished processing.",
            nullable: true,
        },
    )
    @Column({
        name: "processed_at",
        type: "timestamptz",
        nullable: true,
    })
        processedAt: Date | null

    @Field(
        () => String,
        {
            description: "The URL of the source submitted in this attempt.",
        },
    )
    @Column({
        name: "submission_url",
        type: "varchar",
        length: 2048,
    })
        submissionUrl: string

    @Field(
        () => String,
        {
            description: "Concrete AI model that actually graded this attempt (e.g. 'qwen2.5-coder:7b'); null for attempts graded before this was tracked.",
            nullable: true,
        },
    )
    @Column({
        name: "served_model",
        type: "varchar",
        length: 64,
        nullable: true,
    })
        servedModel: string | null

    @Field(
        () => String,
        {
            description: "Provider that served the grading model (e.g. 'local', 'openai', 'gemini'); null for legacy attempts.",
            nullable: true,
        },
    )
    @Column({
        name: "served_provider",
        type: "varchar",
        length: 32,
        nullable: true,
    })
        servedProvider: string | null

    @Field(
        () => Int,
        {
            description: "Input (prompt) tokens the grading model consumed; null for attempts before this was tracked.",
            nullable: true,
        },
    )
    @Column({
        name: "prompt_tokens",
        type: "int",
        nullable: true,
    })
        promptTokens: number | null

    @Field(
        () => Int,
        {
            description: "Output (completion) tokens the grading model produced; null for legacy attempts.",
            nullable: true,
        },
    )
    @Column({
        name: "completion_tokens",
        type: "int",
        nullable: true,
    })
        completionTokens: number | null

    @Field(
        () => UserChallengeSubmissionEntity,
        {
            description: "Parent user challenge submission.",
        },
    )
    @ManyToOne(
        () => UserChallengeSubmissionEntity,
        (ucs: UserChallengeSubmissionEntity) => ucs.attempts,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_challenge_submission_id",
        foreignKeyConstraintName:
            "fk_user_challenge_submission_id_user_challenge_submission_attempts",
    })
        userChallengeSubmission: UserChallengeSubmissionEntity

    @Field(
        () => ID,
        {
            description: "Parent user challenge submission ID.",
        },
    )
    @RelationId(
        (attempt: UserChallengeSubmissionAttemptEntity) => attempt.userChallengeSubmission,
    )
        userChallengeSubmissionId: string

    @Field(
        () => [UserChallengeSubmissionFeedbackEntity],
        {
            nullable: true,
            description: "Detailed feedback items for this attempt.",
        },
    )
    @OneToMany(
        () => UserChallengeSubmissionFeedbackEntity,
        (feedback: UserChallengeSubmissionFeedbackEntity) => feedback.attempt,
        {
            cascade: true,
        },
    )
        feedbacks: Array<UserChallengeSubmissionFeedbackEntity>

    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this attempt.",
        },
    )
    @Column({
        name: "default_locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        defaultLocale: Locale
}
