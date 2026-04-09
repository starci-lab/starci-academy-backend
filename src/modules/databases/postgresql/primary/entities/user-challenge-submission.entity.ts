import {
    Field,
    ObjectType,
    Int,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
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

    @Field(
        () => Boolean,
        {
            description: "Whether the submission has been processed.",
        },
    )
    @Column({
        name: "processed",
        type: "boolean",
        default: false,
    })
        processed: boolean

    @Field(
        () => Date,
        {
            description: "The date and time the submission was processed.",
            nullable: true,
        },
    )
    @Column({
        name: "processed_at",
        type: "timestamptz",
        nullable: true,
    })
        processedAt: Date | null

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
     * The number of attempts made by the user to complete the submission.
     */
    @Field(
        () => Int,
        {
            description: "The number of attempts made by the user to complete the submission.",
        },
    )
    @Column({
        name: "attempts",
        type: "int",
        default: 0,
    })
        attempts: number

    /**
     * The score achieved by the user for the submission.
     */
    @Field(
        () => Int,
        {
            description: "The score achieved by the user for the submission.",
        },
    )
    @Column({
        name: "score",
        type: "int",
        default: 0,
    })
        score: number

    /**
     * Grading feedback text (e.g. concatenated model feedback items).
     */
    @Field(
        () => String,
        {
            description: "Grading feedback from the automated review.",
            nullable: true,
        },
    )
    @Column({
        name: "feedback",
        type: "text",
        nullable: true,
    })
        feedback: string | null
}


