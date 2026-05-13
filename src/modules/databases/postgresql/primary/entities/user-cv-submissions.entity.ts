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
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"
import {
    UserCVSubmissionAttemptEntity,
} from "./user-cv-submission-attempts.entity"
import {
    CvSubmissionStatus,
    GraphQLTypeCvSubmissionStatus
} from "../enums"

/**
 * Root row for **one user-owned CV submission** (one logical CV line; may have many uploaded versions).
 *
 * **Business role**
 * - A user may have one or more `cv_submissions` rows depending on product rules (often one submission per user).
 * - Each new file upload creates a **`UserCVSubmissionAttemptEntity`** (`cv_submission_attempts`): each attempt is a version with its own `attempt_number` and processing `status`.
 * - GraphQL field **`lastAttempt`** is the latest attempt for quick UI reads; full history lives in **`attempts`**.
 * - **`status`** at root level reflects overall submission state; per-step pipeline state (extract → plan → analyze) is tracked mainly on the **attempt** row.
 *
 * **Relations (ER sketch)**
 * ```
 * users (1) ─────< cv_submissions (N)
 * cv_submissions (1) ─────< cv_submission_attempts (N)
 * ```
 *
 * **`file_url` column vs `cdnKey` property**
 * - The TypeScript property is named `cdnKey` but the DB column is `file_url` — typically stores the **object key or URL** on CDN/MinIO for workers to read during extraction.
 */
@ObjectType({
    description: "A user's CV submission root with versioned attempts.",
})
@Entity("cv_submissions")
export class UserCVSubmissionEntity extends UuidAbstractEntity {
    /**
     * Owner user (`user_id` foreign key).
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
        (s: UserCVSubmissionEntity) => s.user,
    )
        userId: string

    @Field(
        () => [UserCVSubmissionAttemptEntity],
        {
            nullable: true,
            description: "Version history of uploaded CV files.",
        },
    )
    @OneToMany(
        () => UserCVSubmissionAttemptEntity,
        (attempt: UserCVSubmissionAttemptEntity) => attempt.cvSubmission,
        {
            cascade: true,
        },
    )
        /** All upload versions (ordering is defined by `attempt_number` on each attempt). */
        attempts: Array<UserCVSubmissionAttemptEntity>

    @Field(
        () => UserCVSubmissionAttemptEntity,
        {
            nullable: true,
            description: "Latest attempt for this CV submission.",
        },
    )
        /** Latest attempt for GraphQL convenience; use `attempts` when you need the full history. */
        lastAttempt?: UserCVSubmissionAttemptEntity

    @Field(
        () => GraphQLTypeCvSubmissionStatus,
        {
            description: "Status of this CV submission.",
        },
    )
    @Column(
        {
            type: "enum",
            enum: CvSubmissionStatus,
            name: "status",
            nullable: false,
            default: CvSubmissionStatus.Pending,
        },
    )
        /** Aggregate status for this root submission (defaults to `Pending`). */
        status: CvSubmissionStatus

    @Field(
        () => String,
        {
            description: "File URL of this CV submission.",
        },
    )
    @Column(
        "varchar",
        {
            nullable: true,
            name: "file_url",
        },
    )
        /**
         * File key/URL at submission root (`file_url` column).
         * May mirror the latest file or stay null if only attempts store files — depends on API flow.
         */
        cdnKey: string
}
