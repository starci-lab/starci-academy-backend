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
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserChallengeSubmissionEntity,
} from "./user-challenge-submission.entity"
import {
    SubmissionFeedbackEntity,
} from "./submission-feedback.entity"

@ObjectType({
    description: "A single attempt of a user challenge submission.",
})
@Entity("submission_attempts")
export class SubmissionAttemptEntity extends UuidAbstractEntity {
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
            "fk_user_challenge_submission_id_submission_attempts",
    })
        userChallengeSubmission: UserChallengeSubmissionEntity

    @Field(
        () => ID,
        {
            description: "Parent user challenge submission ID.",
        },
    )
    @RelationId(
        (attempt: SubmissionAttemptEntity) => attempt.userChallengeSubmission,
    )
        userChallengeSubmissionId: string

    @Field(
        () => [SubmissionFeedbackEntity],
        {
            nullable: true,
            description: "Detailed feedback items for this attempt.",
        },
    )
    @OneToMany(
        () => SubmissionFeedbackEntity,
        (feedback: SubmissionFeedbackEntity) => feedback.attempt,
        {
            cascade: true,
        },
    )
        feedbacks: Array<SubmissionFeedbackEntity>
}
