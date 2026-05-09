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
    EnrollmentEntity,
} from "./enrollment.entity"
import {
    PersonalProjectFeedbackEntity,
} from "./personal-project-feedback.entity"
import {
    MilestoneTaskResultEntity,
} from "./milestone-task-result.entity"

/**
 * A single review attempt of a personal project (enrollment-level).
 */
@ObjectType({
    description: "A single review attempt of a personal project submission.",
})
@Entity("personal_project_attempts")
export class PersonalProjectAttemptEntity extends UuidAbstractEntity {
    @Field(
        () => Int,
        {
            description: "The sequence number of this attempt.",
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
            description: "The GitHub URL submitted in this attempt.",
        },
    )
    @Column({
        name: "submission_url",
        type: "varchar",
        length: 2048,
    })
        submissionUrl: string

    @Field(
        () => EnrollmentEntity,
        {
            description: "Parent enrollment.",
        },
    )
    @ManyToOne(
        () => EnrollmentEntity,
        (enrollment: EnrollmentEntity) => enrollment.attempts,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "enrollment_id",
        foreignKeyConstraintName:
            "fk_enrollment_id_personal_project_attempts_enrollments",
    })
        enrollment: EnrollmentEntity

    @Field(
        () => ID,
        {
            description: "Parent enrollment ID.",
        },
    )
    @RelationId(
        (attempt: PersonalProjectAttemptEntity) => attempt.enrollment,
    )
        enrollmentId: string

    @Field(
        () => [PersonalProjectFeedbackEntity],
        {
            nullable: true,
            description: "Detailed feedback items for this attempt.",
        },
    )
    @OneToMany(
        () => PersonalProjectFeedbackEntity,
        (feedback: PersonalProjectFeedbackEntity) => feedback.attempt,
        {
            cascade: true,
        },
    )
        feedbacks: Array<PersonalProjectFeedbackEntity>

    /**
     * Per-task grading results for this attempt.
     */
    @Field(
        () => [MilestoneTaskResultEntity],
        {
            nullable: true,
            description: "Per-task grading results for this attempt.",
        },
    )
    @OneToMany(
        () => MilestoneTaskResultEntity,
        (taskResult: MilestoneTaskResultEntity) => taskResult.attempt,
        {
            cascade: true,
        },
    )
        taskResults: Array<MilestoneTaskResultEntity>
}
