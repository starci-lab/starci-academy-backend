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
    UuidAbstractEntity,
} from "./abstract"
import {
    UserChallengeSubmissionAttemptEntity,
} from "./user-challenge-submission-attempt.entity"
import {
    SubmissionFeedbackSeverity,
    GraphQLTypeSubmissionFeedbackSeverity,
    GraphQLTypeLocale,
    Locale,
} from "../enums"
/**
 * Structured feedback item for a user submission (1:n with user challenge submission).
 */
@ObjectType({
    description: "Structured feedback item attached to a user challenge submission.",
})
@Entity("user_challenge_submission_feedbacks")
export class UserChallengeSubmissionFeedbackEntity extends UuidAbstractEntity {
    @Field(
        () => String,
        {
            description: "Short summary message for this feedback item.",
        },
    )
    @Column({
        name: "message",
        type: "text",
    })
        message: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "More detailed explanation.",
        },
    )
    @Column({
        name: "detail",
        type: "text",
        nullable: true,
    })
        detail: string | null

    @Field(
        () => GraphQLTypeSubmissionFeedbackSeverity,
        {
            description: "Severity of the feedback item.",
        },
    )
    @Column({
        name: "severity",
        type: "enum",
        enum: SubmissionFeedbackSeverity,
        enumName: "submission_feedback_severity",
        default: SubmissionFeedbackSeverity.Medium,
    })
        severity: SubmissionFeedbackSeverity

    @Field(
        () => String,
        {
            nullable: true,
            description: "Source location hint, e.g. file:line.",
        },
    )
    @Column({
        name: "location",
        type: "varchar",
        length: 512,
        nullable: true,
    })
        location: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Suggested change (code snippet or instruction).",
        },
    )
    @Column({
        name: "suggestion",
        type: "text",
        nullable: true,
    })
        suggestion: string | null

    @Field(
        () => Int,
        {
            description: "Ordering index within the feedback list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    @Field(
        () => UserChallengeSubmissionAttemptEntity,
        {
            description: "Parent submission attempt.",
        },
    )
    @ManyToOne(
        () => UserChallengeSubmissionAttemptEntity,
        (attempt: UserChallengeSubmissionAttemptEntity) => attempt.feedbacks,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_challenge_submission_attempt_id",
        foreignKeyConstraintName:
            "fk_user_challenge_submission_attempt_id_user_challenge_submission_feedbacks",
    })
        attempt: UserChallengeSubmissionAttemptEntity

    @Field(
        () => ID,
        {
            description: "Parent submission attempt ID.",
        },
    )
    @RelationId(
        (submissionFeedback: UserChallengeSubmissionFeedbackEntity) => submissionFeedback.attempt,
    )
        attemptId: string

    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this feedback.",
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

