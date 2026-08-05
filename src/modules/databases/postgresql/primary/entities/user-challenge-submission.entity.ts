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
    EnrollmentEntity,
} from "./enrollment.entity"
import {
    ChallengeSubmissionEntity,
} from "./challenge-submission.entity"
import {
    UserChallengeSubmissionAttemptEntity,
} from "./user-challenge-submission-attempt.entity"

@ObjectType({
    description: "Join table between user and a challenge submission.",
})
@Entity("user_challenge_submissions")
/**
 * Join table between user and a challenge submission.
 */
export class UserChallengeSubmissionEntity extends UuidAbstractEntity {
    /**
     * User who is linked to the submission. Nullable during the enrollment re-key
     * transition; reads/writes go through {@link enrollment} going forward.
     */
    @Field(
        () => UserEntity,
        {
            nullable: true,
            description: "User who is linked to the submission.",
        },
    )
    @ManyToOne(
        () => UserEntity,
        (user: UserEntity) => user.userSubmissions,
        {
            onDelete: "CASCADE",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName:
            "fk_user_id_user_challenge_submissions_users",
    })
        user: UserEntity | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "User ID.",
        },
    )
    @RelationId(
        (ucs: UserChallengeSubmissionEntity) => ucs.user,
    )
        userId: string | null

    /**
     * Enrollment this submission belongs to (user × course). The anchor for
     * per-course progress going forward; nullable while the re-key backfill runs.
     */
    @ManyToOne(
        () => EnrollmentEntity,
        {
            onDelete: "CASCADE",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "enrollment_id",
        foreignKeyConstraintName:
            "fk_enrollment_id_user_challenge_submissions",
    })
        enrollment: EnrollmentEntity | null

    @RelationId(
        (ucs: UserChallengeSubmissionEntity) => ucs.enrollment,
    )
        enrollmentId: string | null


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

    /** SCHEMA V2 only: programming language the learner last chose; null until picked. */
    @Field(
        () => String,
        {
            nullable: true,
            description: "SCHEMA V2: programming language last chosen for this submission; selects the approach-criteria bucket on reopen.",
        },
    )
    @Column({
        name: "selected_lang",
        type: "varchar",
        length: 32,
        nullable: true,
    })
        selectedLang: string | null

    // --- Anti-cheat capture (internal; intentionally NOT exposed via @Field) ---

    @Column({
        name: "ip_address",
        type: "varchar",
        length: 64,
        nullable: true,
    })
        ipAddress: string | null

    @Column({
        name: "user_agent",
        type: "varchar",
        length: 512,
        nullable: true,
    })
        userAgent: string | null

    @Column({
        name: "device_fingerprint",
        type: "varchar",
        length: 256,
        nullable: true,
    })
        deviceFingerprint: string | null

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


