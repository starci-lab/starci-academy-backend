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
    Unique,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserCVSubmissionEntity,
} from "./user-cv-submissions.entity"
import {
    TemplateCVEntity,
} from "./template-cv.entity"

/**
 * **One uploaded version** of a user CV submission (`UserCVSubmissionEntity`): each new file upload is one `cv_submission_attempts` row.
 *
 * **Background worker pipeline (`review-cv-submission`, four steps)** runs on a **staging** attempt (the row created at upload / selected for review).
 * 1. **Extract** — read file from MinIO using `fileUrl`, extract plain text → persist `originalText` on the staging row.
 * 2. **Plan** — LLM reads rubric + `originalText` → persist `reviewPlan` (markdown) on the staging row.
 * 3. **Analyze** — LLM returns JSON with `feedbackDetails` (markdown) and `score` (0–100); stored on the job for the next step.
 * 4. **Complete** — server either updates the staging row in place (in-process review) or **copies** the object in MinIO to `attempts/{cv_submission_id}-{n}.{ext}`, inserts a **new** row with `detailFeedback`, `score`, `originalText`, `reviewPlan`, `status` Done, then **deletes** the staging row (canonical review).
 *
 * While running on staging, **`status`** moves Pending → Processing → (row removed after success) or Failed; aligned with the `jobs` (BullMQ) row referenced by `cvSubmissionAttemptId` in the job payload.
 *
 * **Relations**
 * ```
 * cv_submissions (1) ─────< cv_submission_attempts (N)
 * template_cvs (1) ─────< cv_submission_attempts.template_cv_id (optional, SET NULL if template deleted)
 * ```
 */
@ObjectType({
    description: "A versioned upload attempt for a CV submission.",
})
@Unique(["idempotencyKey"])
@Entity("cv_submission_attempts")
export class UserCVSubmissionAttemptEntity extends UuidAbstractEntity {
    /**
     * Idempotency key (= review job id) set on the canonical reviewed row — a retried
     * review job re-inserting with the same key hits this unique constraint, so the
     * complete step treats it as already-done instead of producing a duplicate version.
     */
    @Column({
        name: "idempotency_key",
        type: "varchar",
        length: 64,
        nullable: true,
    })
        idempotencyKey: string | null

    /**
     * MinIO object key (`cdn_key` column) — worker downloads PDF/DOCX bytes for extraction.
     */
    @Field(
        () => String,
        {
            description: "MinIO object key of this uploaded CV version.",
        },
    )
    @Column({
        name: "cdn_key",
        type: "varchar",
        length: 2048,
    })
        cdnKey: string

    /**
     * Plain text after the extract step (`original_text`); input for plan/analyze.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Extracted plain text from this file version.",
        },
    )
    @Column({
        name: "original_text",
        type: "text",
        nullable: true,
    })
        originalText: string | null

    /**
     * Markdown review plan from the **plan** step, before structured **analyze** scoring.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "AI-generated review plan (markdown) for this attempt, before scoring.",
        },
    )
    @Column({
        name: "review_plan",
        type: "text",
        nullable: true,
    })
        reviewPlan: string | null

    /**
     * Full AI review after the **analyze** step (`detail_feedback`); markdown with summary, strengths, score, etc.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Full AI review output (markdown) after analyze completes.",
        },
    )
    @Column({
        name: "detail_feedback",
        type: "text",
        nullable: true,
    })
        detailFeedback: string | null

    /**
     * Holistic AI score (0–100) from the analyze step JSON `score` field (`score` column).
     */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "AI holistic score (0–100) for this attempt after review completes.",
        },
    )
    @Column({
        name: "score",
        type: "int",
        nullable: true,
    })
        score: number | null

    /**
     * Version ordinal within one `cv_submission` (1, 2, 3, …) — `attempt_number` column.
     */
    @Field(
        () => Int,
        {
            description: "Version number within one CV submission.",
        },
    )
    @Column({
        name: "attempt_number",
        type: "int",
    })
        attemptNumber: number

    @Field(
        () => Date,
        {
            nullable: true,
            description: "When this attempt finished processing.",
        },
    )
    @Column({
        name: "processed_at",
        type: "timestamptz",
        nullable: true,
    })
        processedAt: Date | null

    @Field(
        () => UserCVSubmissionEntity,
        {
            description: "Parent CV submission.",
        },
    )
    @ManyToOne(
        () => UserCVSubmissionEntity,
        (cvSubmission: UserCVSubmissionEntity) => cvSubmission.attempts,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "cv_submission_id",
        foreignKeyConstraintName: "fk_cv_submission_id_cv_submission_attempts_cv_submissions",
    })
        cvSubmission: UserCVSubmissionEntity

    @Field(
        () => ID,
        {
            description: "Parent CV submission ID.",
        },
    )
    @RelationId(
        (attempt: UserCVSubmissionAttemptEntity) => attempt.cvSubmission,
    )
        cvSubmissionId: string

    /**
     * Grading rubric template used when scoring this attempt.
     */
    @Field(
        () => TemplateCVEntity,
        {
            nullable: true,
            description: "Rubric template (Junior/Mid/Senior) used to analyze this CV attempt.",
        },
    )
    @ManyToOne(
        () => TemplateCVEntity,
        {
            onDelete: "SET NULL",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "template_cv_id",
        foreignKeyConstraintName: "fk_template_cv_id_cv_submission_attempts_template_cvs",
    })
        templateCv: TemplateCVEntity | null

    @Field(
        () => ID,
        {
            nullable: true,
            description: "ID of the grading rubric template used.",
        },
    )
    @RelationId(
        (attempt: UserCVSubmissionAttemptEntity) => attempt.templateCv,
    )
        templateCvId: string | null
}
