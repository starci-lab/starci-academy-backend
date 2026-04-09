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
    UserChallengeSubmissionEntity,
} from "./user-challenge-submission.entity"
import {
    SubmissionFeedbackSeverity,
    GraphQLTypeSubmissionFeedbackSeverity,
} from "../enums"
/**
 * Structured feedback item for a user submission (1:n with user challenge submission).
 */
@ObjectType({
    description: "Structured feedback item attached to a user challenge submission.",
})
@Entity("submission_feedbacks")
export class SubmissionFeedbackEntity extends UuidAbstractEntity {
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
        () => UserChallengeSubmissionEntity,
        {
            description: "Parent user challenge submission.",
        },
    )
    @ManyToOne(
        () => UserChallengeSubmissionEntity,
        (userChallengeSubmission: UserChallengeSubmissionEntity) => userChallengeSubmission.submissionFeedbacks,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_challenge_submission_id",
        foreignKeyConstraintName:
            "fk_user_challenge_submission_id_submission_feedbacks_user_challenge_submissions",
    })
        userChallengeSubmission: UserChallengeSubmissionEntity

    @Field(
        () => ID,
        {
            description: "Parent user challenge submission ID.",
        },
    )
    @RelationId(
        (submissionFeedback: SubmissionFeedbackEntity) => submissionFeedback.userChallengeSubmission,
    )
        userChallengeSubmissionId: string
}

