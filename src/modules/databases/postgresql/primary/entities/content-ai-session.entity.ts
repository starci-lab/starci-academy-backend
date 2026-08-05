import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    EnrollmentEntity,
} from "./enrollment.entity"
import {
    ContentEntity,
} from "./content.entity"
import {
    MilestoneTaskEntity,
} from "./milestone-task.entity"
import {
    ChallengeEntity,
} from "./challenge.entity"
import {
    FlashcardDeckEntity,
} from "./flashcard-deck.entity"
import {
    FoundationEntity,
} from "./foundation.entity"
import {
    UserEntity,
} from "./user.entity"

/**
 * Which surface a content-AI conversation grounds on — the SESSION-PER-SCOPE model.
 * The `scope` selects WHICH anchor column identifies the conversation:
 * - `content`  → `originContent` (a course lesson/content item).
 * - `task`     → `originTask` (a capstone / personal-project task).
 * - `challenge` → `originChallenge` (a hands-on challenge).
 * - `quiz`     → `originQuiz` (a flashcard-quiz deck).
 * - `foundation` → `originFoundation` (a GLOBAL foundation-library doc; no course).
 * - `course`   → the enrollment's course itself (no per-item anchor).
 * - `global`   → the app-wide chat; no anchor column at all — keys off {@link
 *   ContentAiSessionEntity.user} the same way `foundation` does.
 */
export type ContentAiSessionScope = "content" | "task" | "challenge" | "quiz" | "foundation" | "course" | "global"

@Index(["enrollment", "originContent"])
@Index(["user"])
@Entity("content_ai_sessions")
/**
 * One content-AI conversation thread — a named chat a learner keeps about a lesson,
 * a capstone task, a foundation doc, or a whole course. A surface can hold MANY
 * sessions (e.g. one about nginx, one about kafka), so the learner keeps separate,
 * searchable conversations. {@link import("./content-ai-message.entity").ContentAiMessageEntity}
 * rows key off the session; a content-scope turn also records the content it was
 * grounded on, so one conversation can span lessons.
 *
 * Anchoring follows the enrollment-centric model: course-scoped sessions
 * (content / task / course) key off the **enrollment** (learner ↔ course);
 * course-agnostic sessions (a GLOBAL foundation doc) key off the raw **user**,
 * which is why both `enrollment` and `originContent` are nullable.
 */
export class ContentAiSessionEntity extends UuidAbstractEntity {
    /**
     * Which surface the conversation grounds on. Drives which anchor column is set
     * (content → originContent, task → originTask, foundation → originFoundation,
     * course → none). varchar (not a PG enum) so widening the scope set never hits
     * the enum-ADD-VALUE / DROP-TYPE boot trap under prod `synchronize`.
     */
    @Column({
        name: "scope",
        type: "varchar",
        length: 16,
        default: "content",
    })
        scope: ContentAiSessionScope

    /**
     * Enrollment (learner ↔ course) the conversation belongs to. NULL for a
     * course-agnostic foundation session (which keys off {@link user} instead).
     */
    @ManyToOne(
        () => EnrollmentEntity,
        {
            onDelete: "CASCADE",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "enrollment_id",
        foreignKeyConstraintName: "fk_enrollment_id_content_ai_sessions_enrollments",
    })
        enrollment: EnrollmentEntity | null

    /** Owning enrollment id (null for a foundation session). */
    @Column({
        name: "enrollment_id",
        type: "uuid",
        nullable: true,
    })
    @RelationId(
        (session: ContentAiSessionEntity) => session.enrollment,
    )
        enrollmentId: string | null

    /**
     * Owner of a course-agnostic (foundation) session, which has no enrollment to
     * key off. NULL for course-scoped sessions (content / task / course), whose
     * owner is resolved through {@link enrollment}.
     */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_content_ai_sessions_users",
    })
        user: UserEntity | null

    /** Owning user id (set only for foundation sessions). */
    @Column({
        name: "user_id",
        type: "uuid",
        nullable: true,
    })
    @RelationId(
        (session: ContentAiSessionEntity) => session.user,
    )
        userId: string | null

    /**
     * Content the conversation is anchored to (content scope). NULL for a
     * task/foundation/course session.
     */
    @ManyToOne(
        () => ContentEntity,
        {
            onDelete: "CASCADE",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "origin_content_id",
        foreignKeyConstraintName: "fk_origin_content_id_content_ai_sessions_contents",
    })
        originContent: ContentEntity | null

    /** Owning (origin) content id (null unless scope = content). */
    @Column({
        name: "origin_content_id",
        type: "uuid",
        nullable: true,
    })
    @RelationId(
        (session: ContentAiSessionEntity) => session.originContent,
    )
        originContentId: string | null

    /**
     * Capstone / personal-project task the conversation is anchored to (task
     * scope). NULL unless scope = task.
     */
    @ManyToOne(
        () => MilestoneTaskEntity,
        {
            onDelete: "CASCADE",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "origin_task_id",
        foreignKeyConstraintName: "fk_origin_task_id_content_ai_sessions_milestone_tasks",
    })
        originTask: MilestoneTaskEntity | null

    /** Owning (origin) task id (null unless scope = task). */
    @Column({
        name: "origin_task_id",
        type: "uuid",
        nullable: true,
    })
    @RelationId(
        (session: ContentAiSessionEntity) => session.originTask,
    )
        originTaskId: string | null

    /**
     * Hands-on challenge the conversation is anchored to (challenge scope). NULL
     * unless scope = challenge.
     */
    @ManyToOne(
        () => ChallengeEntity,
        {
            onDelete: "CASCADE",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "origin_challenge_id",
        foreignKeyConstraintName: "fk_origin_challenge_id_content_ai_sessions_challenges",
    })
        originChallenge: ChallengeEntity | null

    /** Owning (origin) challenge id (null unless scope = challenge). */
    @Column({
        name: "origin_challenge_id",
        type: "uuid",
        nullable: true,
    })
    @RelationId(
        (session: ContentAiSessionEntity) => session.originChallenge,
    )
        originChallengeId: string | null

    /**
     * Flashcard-quiz deck the conversation is anchored to (quiz scope). NULL unless
     * scope = quiz.
     */
    @ManyToOne(
        () => FlashcardDeckEntity,
        {
            onDelete: "CASCADE",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "origin_quiz_id",
        foreignKeyConstraintName: "fk_origin_quiz_id_content_ai_sessions_flashcard_decks",
    })
        originQuiz: FlashcardDeckEntity | null

    /** Owning (origin) quiz deck id (null unless scope = quiz). */
    @Column({
        name: "origin_quiz_id",
        type: "uuid",
        nullable: true,
    })
    @RelationId(
        (session: ContentAiSessionEntity) => session.originQuiz,
    )
        originQuizId: string | null

    /**
     * Global foundation-library doc the conversation is anchored to (foundation
     * scope). NULL unless scope = foundation.
     */
    @ManyToOne(
        () => FoundationEntity,
        {
            onDelete: "CASCADE",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "origin_foundation_id",
        foreignKeyConstraintName: "fk_origin_foundation_id_content_ai_sessions_foundations",
    })
        originFoundation: FoundationEntity | null

    /** Owning (origin) foundation id (null unless scope = foundation). */
    @Column({
        name: "origin_foundation_id",
        type: "uuid",
        nullable: true,
    })
    @RelationId(
        (session: ContentAiSessionEntity) => session.originFoundation,
    )
        originFoundationId: string | null

    /** Conversation title — auto-derived from the first question; null until then. */
    @Column({
        name: "title",
        type: "varchar",
        length: 200,
        nullable: true,
    })
        title: string | null

    /**
     * When the conversation was archived; null = active. Archived sessions drop
     * out of the default history list but are still returned by search (that is
     * exactly when a learner wants to dig one back up). Selection-passage sessions
     * are born-archived (set to `now()` at creation) so they never clutter the
     * list yet stay searchable.
     */
    @Column({
        name: "archived_at",
        type: "timestamptz",
        nullable: true,
    })
        archivedAt: Date | null
}
