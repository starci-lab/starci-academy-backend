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
    })
        user: UserEntity

    @Field(
        () => String,
        {
            description: "User ID.",
        },
    )
    @Column({
        name: "user_id",
    })
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
        processedAt?: Date

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
    })
        submission: ChallengeSubmissionEntity

    @Field(
        () => String,
        {
            description: "Submission ID.",
        },
    )
    @Column({
        name: "submission_id",
    })
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
}


