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
    ContentAiSessionEntity,
} from "./content-ai-session.entity"

/**
 * One persisted content-AI chat turn, belonging to a
 * {@link ContentAiSessionEntity} (a named conversation). Each turn also records
 * the **content it was grounded on** (`content`) — so one conversation can span
 * lessons. Rows are loaded oldest-first to rebuild the thread on reopen.
 *
 * Course-scoped data keys off the **enrollment** (the enrollment-centric model),
 * not the raw user. No AI-usage / credit ledger is written for these — content-AI
 * runs on the free local tier.
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

    /** Enrollment (learner ↔ course) the conversation belongs to. */
    @ManyToOne(
        () => EnrollmentEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "enrollment_id",
        foreignKeyConstraintName: "fk_enrollment_id_content_ai_messages_enrollments",
    })
        enrollment: EnrollmentEntity

    /** Owning enrollment id. */
    @Column({
        name: "enrollment_id",
        type: "uuid",
    })
    @RelationId(
        (message: ContentAiMessageEntity) => message.enrollment,
    )
        enrollmentId: string

    /** Content (lesson) the conversation is about. */
    @ManyToOne(
        () => ContentEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "content_id",
        foreignKeyConstraintName: "fk_content_id_content_ai_messages_contents",
    })
        content: ContentEntity

    /** Owning content id. */
    @Column({
        name: "content_id",
        type: "uuid",
    })
    @RelationId(
        (message: ContentAiMessageEntity) => message.content,
    )
        contentId: string

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
