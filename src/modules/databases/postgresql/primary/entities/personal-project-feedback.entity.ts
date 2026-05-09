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
    PersonalProjectAttemptEntity,
} from "./personal-project-attempt.entity"
import {
    SubmissionFeedbackSeverity,
    GraphQLTypeSubmissionFeedbackSeverity,
} from "../enums"

/**
 * Structured feedback item for a personal project review.
 * Describes what implementation is missing or wrong — not code-level review.
 */
@ObjectType({
    description: "Structured feedback item for a personal project review attempt.",
})
@Entity("personal_project_feedbacks")
export class PersonalProjectFeedbackEntity extends UuidAbstractEntity {
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
            description: "More detailed explanation of what is missing or wrong.",
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
            description: "Suggested improvement or fix.",
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
        () => PersonalProjectAttemptEntity,
        {
            description: "Parent attempt.",
        },
    )
    @ManyToOne(
        () => PersonalProjectAttemptEntity,
        (attempt: PersonalProjectAttemptEntity) => attempt.feedbacks,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "personal_project_attempt_id",
        foreignKeyConstraintName:
            "fk_attempt_id_personal_project_feedbacks",
    })
        attempt: PersonalProjectAttemptEntity

    @Field(
        () => ID,
        {
            description: "Parent attempt ID.",
        },
    )
    @RelationId(
        (feedback: PersonalProjectFeedbackEntity) => feedback.attempt,
    )
        attemptId: string
}
