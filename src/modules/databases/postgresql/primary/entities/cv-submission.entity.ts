import {
    Field,
    ID,
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
    CvSubmissionStatus,
    GraphQLTypeCvSubmissionStatus,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"
import {
    CVPromptEntity,
} from "./cv-prompt.entity"
import {
    CVSubmissionAttemptEntity,
} from "./cv-submission-attempt.entity"

/**
 * Tracks one CV profile across multiple upload/review versions.
 *
 * Relations:
 *   users      1 ──── N   cv_submissions
 *   cv_prompts 1 ──── N   cv_submissions
 *   cv_submissions 1 ──── N cv_submission_attempts
 */
@ObjectType({
    description: "A user's CV submission root with versioned attempts.",
})
@Entity("cv_submissions")
export class CVSubmissionEntity extends UuidAbstractEntity {
    /**
     * Aggregated status of the latest review attempt.
     */
    @Field(
        () => GraphQLTypeCvSubmissionStatus,
        {
            description: "Current status of the latest CV attempt.",
        },
    )
    @Column({
        name: "status",
        type: "enum",
        enum: CvSubmissionStatus,
        enumName: "cv_submission_status",
        default: CvSubmissionStatus.Pending,
    })
        status: CvSubmissionStatus

    /**
     * Latest human-friendly feedback snapshot for quick display.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Latest feedback summary for this CV submission.",
        },
    )
    @Column({
        name: "feedback",
        type: "text",
        nullable: true,
    })
        feedback: string | null

    /**
     * The user who submitted this CV.
     */
    @Field(
        () => UserEntity,
        {
            description: "User who submitted this CV.",
        },
    )
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_cv_submissions_users",
    })
        user: UserEntity

    @Field(
        () => ID,
        {
            description: "ID of the user who submitted the CV.",
        },
    )
    @RelationId(
        (s: CVSubmissionEntity) => s.user,
    )
        userId: string

    /**
     * The prompt template used to analyse this submission.
     */
    @Field(
        () => CVPromptEntity,
        {
            nullable: true,
            description: "Prompt template used to analyse this CV.",
        },
    )
    @ManyToOne(
        () => CVPromptEntity,
        (prompt: CVPromptEntity) => prompt.submissions,
        {
            onDelete: "SET NULL",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "cv_prompt_id",
        foreignKeyConstraintName: "fk_cv_prompt_id_cv_submissions_cv_prompts",
    })
        cvPrompt: CVPromptEntity | null

    @Field(
        () => ID,
        {
            nullable: true,
            description: "ID of the prompt template used.",
        },
    )
    @RelationId(
        (s: CVSubmissionEntity) => s.cvPrompt,
    )
        cvPromptId: string | null

    @Field(
        () => [CVSubmissionAttemptEntity],
        {
            nullable: true,
            description: "Version history of uploaded CV files.",
        },
    )
    @OneToMany(
        () => CVSubmissionAttemptEntity,
        (attempt: CVSubmissionAttemptEntity) => attempt.cvSubmission,
        {
            cascade: true,
        },
    )
        attempts: Array<CVSubmissionAttemptEntity>

    @Field(
        () => CVSubmissionAttemptEntity,
        {
            nullable: true,
            description: "Latest attempt for this CV submission.",
        },
    )
        lastAttempt?: CVSubmissionAttemptEntity
}
