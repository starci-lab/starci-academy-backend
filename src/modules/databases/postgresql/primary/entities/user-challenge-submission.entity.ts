import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    RelationId,
} from "typeorm"
import {
    AiMode,
    GraphQLTypeAiMode,
    GraphQLTypeModelProvider,
    ModelProvider,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"
import {
    ChallengeSubmissionEntity,
} from "./challenge-submission.entity"
import {
    UserChallengeSubmissionAttemptEntity,
} from "./user-challenge-submission-attempt.entity"

/**
 * Join table between user and a challenge submission.
 */
@ObjectType({
    description: "Join table between user and a challenge submission.",
})
@Entity("user_challenge_submissions")
export class UserChallengeSubmissionEntity extends UuidAbstractEntity {
    /**
     * User who is linked to the submission.
     */
    @Field(
        () => UserEntity,
        {
            description: "User who is linked to the submission.",
        },
    )
    @ManyToOne(
        () => UserEntity,
        (user: UserEntity) => user.userSubmissions,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName:
            "fk_user_id_user_challenge_submissions_users",
    })
        user: UserEntity

    @Field(
        () => String,
        {
            description: "User ID.",
        },
    )
    @RelationId(
        (ucs: UserChallengeSubmissionEntity) => ucs.user,
    )
        userId: string


    /**
     * Submission definition linked to the user.
     */
    @Field(
        () => ChallengeSubmissionEntity,
        {
            description: "Submission definition linked to the user.",
        },
    )
    @ManyToOne(
        () => ChallengeSubmissionEntity,
        (submission: ChallengeSubmissionEntity) => submission.userSubmissions,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "submission_id",
        foreignKeyConstraintName:
            "fk_submission_id_user_challenge_submissions_challenge_submissions",
    })
        submission: ChallengeSubmissionEntity

    @Field(
        () => String,
        {
            description: "Submission ID.",
        },
    )
    @RelationId(
        (ucs: UserChallengeSubmissionEntity) => ucs.submission,
    )
        submissionId: string

    /**
     * The URL of the submission.
     */
    @Field(
        () => String,
        {
            description: "The URL of the submission.",
        },
    )
    @Column({
        name: "submission_url",
        type: "varchar",
        length: 2048,
    })
        submissionUrl: string

    /**
     * AI grading lane the user last chose for this submission (auto/premium/byok);
     * null until they pick one. Persisted so the picker pre-fills on reopen.
     */
    @Field(
        () => GraphQLTypeAiMode,
        {
            nullable: true,
            description: "AI grading lane last chosen for this submission; null until picked.",
        },
    )
    @Column({
        name: "selected_mode",
        type: "enum",
        enum: AiMode,
        enumName: "ai_mode",
        nullable: true,
    })
        selectedMode: AiMode | null

    /**
     * Concrete model name the user last chose for this submission (e.g.
     * "gpt-4o"); null = let the balancer pick. Persisted to pre-fill the picker.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Concrete model name last chosen for this submission; null = balancer default.",
        },
    )
    @Column({
        name: "selected_model",
        type: "varchar",
        length: 128,
        nullable: true,
    })
        selectedModel: string | null

    /** Provider serving {@link selectedModel}; null when no model chosen. */
    @Field(
        () => GraphQLTypeModelProvider,
        {
            nullable: true,
            description: "Provider serving the chosen model; null when no model chosen.",
        },
    )
    @Column({
        name: "selected_model_provider",
        type: "enum",
        enum: ModelProvider,
        enumName: "model_provider",
        nullable: true,
    })
        selectedModelProvider: ModelProvider | null



    @OneToMany(
        () => UserChallengeSubmissionAttemptEntity,
        (attempt: UserChallengeSubmissionAttemptEntity) => attempt.userChallengeSubmission,
        {
            cascade: true,
        },
    )
    @Field(
        () => [UserChallengeSubmissionAttemptEntity],
        {
            nullable: true,
            description: "History of submission attempts.",
        },
    )
        attempts: Array<UserChallengeSubmissionAttemptEntity>

    @Field(
        () => UserChallengeSubmissionAttemptEntity,
        {
            nullable: true,
            description: "The latest attempt for this submission.",
        },
    )
        lastAttempt?: UserChallengeSubmissionAttemptEntity
}


