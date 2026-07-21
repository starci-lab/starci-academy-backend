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

/**
 * One content-AI conversation thread — a named chat a learner has about a lesson
 * within their course enrollment. A content can hold MANY sessions (e.g. one
 * about nginx, one about kafka), so the learner can keep separate, searchable
 * conversations. {@link import("./content-ai-message.entity").ContentAiMessageEntity}
 * rows key off the session; each message also records the content it was grounded
 * on, so a single conversation can span lessons.
 *
 * Course-scoped data keys off the **enrollment** (the enrollment-centric model),
 * not the raw user.
 */
@Index(["enrollment", "originContent"])
@Entity("content_ai_sessions")
export class ContentAiSessionEntity extends UuidAbstractEntity {
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
        foreignKeyConstraintName: "fk_enrollment_id_content_ai_sessions_enrollments",
    })
        enrollment: EnrollmentEntity

    /** Owning enrollment id. */
    @Column({
        name: "enrollment_id",
        type: "uuid",
    })
    @RelationId(
        (session: ContentAiSessionEntity) => session.enrollment,
    )
        enrollmentId: string

    /** Content the conversation was started in / is listed under (per-lesson scope). */
    @ManyToOne(
        () => ContentEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "origin_content_id",
        foreignKeyConstraintName: "fk_origin_content_id_content_ai_sessions_contents",
    })
        originContent: ContentEntity

    /** Owning (origin) content id. */
    @Column({
        name: "origin_content_id",
        type: "uuid",
    })
    @RelationId(
        (session: ContentAiSessionEntity) => session.originContent,
    )
        originContentId: string

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
