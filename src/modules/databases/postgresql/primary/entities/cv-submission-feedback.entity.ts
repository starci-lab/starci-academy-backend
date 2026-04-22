import {
    Field,
    Float,
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
    CVSubmissionAttemptEntity,
} from "./cv-submission-attempt.entity"

export interface CVSpellError {
    word: string
    suggestion: string
    line: number
}

@ObjectType({
    description: "Structured AI feedback for one CV attempt.",
})
@Entity("cv_submission_feedbacks")
export class CVSubmissionFeedbackEntity extends UuidAbstractEntity {
    @Field(
        () => String,
        {
            description: "2-3 sentence summary for this CV attempt.",
        },
    )
    @Column({
        name: "summary",
        type: "text",
    })
        summary: string

    @Field(
        () => [String],
        {
            nullable: true,
            description: "Detected strengths.",
        },
    )
    @Column({
        name: "strength",
        type: "jsonb",
        nullable: true,
    })
        strength: Array<string> | null

    @Field(
        () => [String],
        {
            nullable: true,
            description: "Detected weaknesses.",
        },
    )
    @Column({
        name: "weakness",
        type: "jsonb",
        nullable: true,
    })
        weakness: Array<string> | null

    @Field(
        () => [String],
        {
            nullable: true,
            description: "Suggested job titles.",
        },
    )
    @Column({
        name: "suggested_jobs",
        type: "jsonb",
        nullable: true,
    })
        suggestedJobs: Array<string> | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "JSON array of spelling errors.",
        },
    )
    @Column({
        name: "spell_errors",
        type: "jsonb",
        nullable: true,
    })
        spellErrors: Array<CVSpellError> | null

    @Field(
        () => Float,
        {
            nullable: true,
            description: "Holistic score 0-100.",
        },
    )
    @Column({
        name: "score",
        type: "float",
        nullable: true,
    })
        score: number | null

    @Field(
        () => Int,
        {
            description: "Ordering index in case of multiple feedback rows.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    @Field(
        () => CVSubmissionAttemptEntity,
        {
            description: "Parent CV submission attempt.",
        },
    )
    @ManyToOne(
        () => CVSubmissionAttemptEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "cv_submission_attempt_id",
        foreignKeyConstraintName: "fk_cv_submission_attempt_id_cv_submission_feedbacks_cv_submission_attempts",
    })
        attempt: CVSubmissionAttemptEntity

    @Field(
        () => ID,
        {
            description: "Parent CV submission attempt ID.",
        },
    )
    @RelationId(
        (feedback: CVSubmissionFeedbackEntity) => feedback.attempt,
    )
        attemptId: string
}
