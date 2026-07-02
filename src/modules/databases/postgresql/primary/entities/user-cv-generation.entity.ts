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
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"
import {
    CvGenerationMode,
    GraphQLTypeCvGenerationMode,
} from "../enums/cv-generation-mode"
import {
    CvGenerationStatus,
    GraphQLTypeCvGenerationStatus,
} from "../enums/cv-generation-status"

/**
 * **One CV *generation* run** — distinct from the legacy upload/review flow
 * (`UserCVSubmissionEntity` / `UserCVSubmissionAttemptEntity`, which stay
 * untouched). Here the user asks the system to **build** a CV from free-text
 * input, or **revise** an existing uploaded submission.
 *
 * **Background worker pipeline**
 * 1. **Assemble** — LLM reads `extraPrompts` (and, when `mode` = `Revise`, the
 *    source submission at `sourceCvSubmissionId`) → persist the structured CV
 *    JSON into `structuredData` (header / summary / skills / experience /
 *    education).
 * 2. **Render** — turn `structuredData` into a `.tex` document, upload to MinIO
 *    → persist the object key into `latexCdnKey`.
 *
 * **`status`** moves Pending → Processing → Done (or Failed, with
 * `errorMessage` populated). This is a *generation*, not a graded review, so
 * there is intentionally no score / detailFeedback here.
 *
 * **Relations**
 * ```
 * users (1) ─────< cv_generations (N)
 * ```
 */
@ObjectType({
    description: "A single CV generation run (build new or revise existing).",
})
@Entity("cv_generations")
export class UserCvGenerationEntity extends UuidAbstractEntity {
    /**
     * Owner user (`user_id` foreign key).
     */
    @Field(
        () => UserEntity,
        {
            description: "User who requested this CV generation.",
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
        foreignKeyConstraintName: "fk_user_id_cv_generations_users",
    })
        user: UserEntity

    @Field(
        () => ID,
        {
            description: "ID of the user who requested this CV generation.",
        },
    )
    @RelationId(
        (generation: UserCvGenerationEntity) => generation.user,
    )
        userId: string

    /**
     * Whether this run builds a new CV or revises an existing submission.
     */
    @Field(
        () => GraphQLTypeCvGenerationMode,
        {
            description: "Whether this run builds a new CV or revises an existing submission.",
        },
    )
    @Column({
        type: "enum",
        enum: CvGenerationMode,
        name: "mode",
        nullable: false,
    })
        mode: CvGenerationMode

    /**
     * Processing status of this generation run (defaults to `Pending`).
     */
    @Field(
        () => GraphQLTypeCvGenerationStatus,
        {
            description: "Processing status of this generation run.",
        },
    )
    @Column({
        type: "enum",
        enum: CvGenerationStatus,
        name: "status",
        nullable: false,
        default: CvGenerationStatus.Pending,
    })
        status: CvGenerationStatus

    /**
     * When `mode` = `Revise`, the id of the legacy `UserCVSubmissionEntity`
     * being revised (`source_cv_submission_id`). Plain nullable uuid column
     * (no FK relation) so the generation history survives even if the source
     * submission is later deleted, and to avoid coupling the new generation
     * flow to the legacy upload entity.
     */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "ID of the source CV submission being revised (when mode = Revise).",
        },
    )
    @Column({
        name: "source_cv_submission_id",
        type: "uuid",
        nullable: true,
    })
        sourceCvSubmissionId: string | null

    /**
     * User's free-text input describing projects, skills, and experience
     * (e.g. "I built project A, project B, I know Golang / TypeScript…").
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "User's free-text input describing projects, skills, and experience.",
        },
    )
    @Column({
        name: "extra_prompts",
        type: "text",
        nullable: true,
    })
        extraPrompts: string | null

    /**
     * The assembled CV JSON (header / summary / skills / experience /
     * education) produced by the assemble step.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Assembled CV JSON (header/summary/skills/experience/education).",
        },
    )
    @Column({
        name: "structured_data",
        type: "jsonb",
        nullable: true,
    })
        structuredData: Record<string, unknown> | null

    /**
     * MinIO object key of the generated `.tex` file (`latex_cdn_key`).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "MinIO object key of the generated .tex file.",
        },
    )
    @Column({
        name: "latex_cdn_key",
        type: "varchar",
        length: 2048,
        nullable: true,
    })
        latexCdnKey: string | null

    @Field(
        () => Date,
        {
            nullable: true,
            description: "When this generation run finished processing.",
        },
    )
    @Column({
        name: "processed_at",
        type: "timestamptz",
        nullable: true,
    })
        processedAt: Date | null

    /**
     * Error detail populated when `status` = `Failed`.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Error message populated when the generation fails.",
        },
    )
    @Column({
        name: "error_message",
        type: "text",
        nullable: true,
    })
        errorMessage: string | null
}
