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
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"
import {
    ChallengeSubmissionEntity,
} from "./challenge-submission.entity"
import {
    SubmissionAttemptEntity,
} from "./submission-attempt.entity"

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



    @OneToMany(
        () => SubmissionAttemptEntity,
        (attempt: SubmissionAttemptEntity) => attempt.userChallengeSubmission,
        {
            cascade: true,
        },
    )
    @Field(
        () => [SubmissionAttemptEntity],
        {
            nullable: true,
            description: "History of submission attempts.",
        },
    )
        attempts: Array<SubmissionAttemptEntity>

    @Field(
        () => SubmissionAttemptEntity,
        {
            nullable: true,
            description: "The latest attempt for this submission.",
        },
    )
        lastAttempt?: SubmissionAttemptEntity
}


