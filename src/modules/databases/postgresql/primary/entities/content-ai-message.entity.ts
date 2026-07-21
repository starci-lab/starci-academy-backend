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
    UserEntity,
} from "./user.entity"
import {
    ContentAiSessionEntity,
} from "./content-ai-session.entity"

/**
 * One persisted content-AI chat turn, belonging to a
 * {@link ContentAiSessionEntity} (a named conversation). A content-scope turn also
 * records the **content it was grounded on** (`content`) — so one conversation can
 * span lessons. Rows are loaded oldest-first to rebuild the thread on reopen.
 *
 * Anchoring mirrors the session: a course-scoped turn (content / task / course)
 * keys off the **enrollment**; a course-agnostic (foundation) turn keys off the
 * raw **user** — so `enrollment` and `content` are both nullable. No AI-usage /
 * credit ledger is written for these — content-AI runs on the free local tier.
 */
@Index(["session"])
@Index(["enrollment", "content"])
@Entity("content_ai_messages")
export class ContentAiMessageEntity extends UuidAbstractEntity {
    /**
     * Conversation this turn belongs to. Nullable for back-compat with legacy
     * rows persisted before sessions existed (a migration backfills them).
     */
    @ManyToOne(
        () => ContentAiSessionEntity,
        {
            onDelete: "CASCADE",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "session_id",
        foreignKeyConstraintName: "fk_session_id_content_ai_messages_sessions",
    })
        session: ContentAiSessionEntity | null

    /** Owning session id (null only for legacy pre-session rows). */
    @Column({
        name: "session_id",
        type: "uuid",
        nullable: true,
    })
    @RelationId(
        (message: ContentAiMessageEntity) => message.session,
    )
        sessionId: string | null

    /**
     * Enrollment (learner ↔ course) the conversation belongs to. NULL for a
     * course-agnostic foundation turn (which keys off {@link user} instead).
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
        foreignKeyConstraintName: "fk_enrollment_id_content_ai_messages_enrollments",
    })
        enrollment: EnrollmentEntity | null

    /** Owning enrollment id (null for a foundation turn). */
    @Column({
        name: "enrollment_id",
        type: "uuid",
        nullable: true,
    })
    @RelationId(
        (message: ContentAiMessageEntity) => message.enrollment,
    )
        enrollmentId: string | null

    /**
     * Owner of a course-agnostic (foundation) turn, which has no enrollment. NULL
     * for a course-scoped turn (content / task / course), whose owner resolves
     * through {@link enrollment}.
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
        foreignKeyConstraintName: "fk_user_id_content_ai_messages_users",
    })
        user: UserEntity | null

    /** Owning user id (set only for a foundation turn). */
    @Column({
        name: "user_id",
        type: "uuid",
        nullable: true,
    })
    @RelationId(
        (message: ContentAiMessageEntity) => message.user,
    )
        userId: string | null

    /**
     * Content (lesson) the turn was grounded on (content scope). NULL for a
     * task/foundation/course turn.
     */
    @ManyToOne(
        () => ContentEntity,
        {
            onDelete: "CASCADE",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "content_id",
        foreignKeyConstraintName: "fk_content_id_content_ai_messages_contents",
    })
        content: ContentEntity | null

    /** Owning content id (null unless the turn is content-scoped). */
    @Column({
        name: "content_id",
        type: "uuid",
        nullable: true,
    })
    @RelationId(
        (message: ContentAiMessageEntity) => message.content,
    )
        contentId: string | null

    /** Author of the turn: `"user"` or `"assistant"`. */
    @Column({
        name: "role",
        type: "varchar",
        length: 16,
    })
        role: string

    /** The turn text (user question or assistant answer; may be markdown). */
    @Column({
        name: "message",
        type: "text",
    })
        message: string
}
