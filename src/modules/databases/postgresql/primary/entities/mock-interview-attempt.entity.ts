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

/**
 * One graded mock-interview SESSION (not one question — the whole 5-phase
 * interview is graded once, at the end). Mirrors {@link import("./interview-attempt.entity").InterviewAttemptEntity}'s
 * append-only-log shape, but the unit is a full interview run rather than a
 * single flashcard answer: `phaseScores` + `attributeScores` carry the rubric
 * breakdown the scorecard renders, and `promptId` snapshots WHICH capstone
 * system (or, later, AI-generated classic) the learner designed.
 */
@Entity("mock_interview_attempts")
// fast scan of a user's mock-interview history, optionally scoped to a course
// (enrollment already scopes to one course × user, so the composite mirrors
// InterviewAttemptEntity's user+deck index)
@Index("idx_mock_interview_attempts_enrollment",
    [
        "enrollmentId",
    ])
export class MockInterviewAttemptEntity extends UuidAbstractEntity {
    /**
     * Enrollment this interview session belongs to (user × course) — the anchor
     * for per-course history, consistent with the enrollment-centric re-key
     * already applied to {@link import("./interview-attempt.entity").InterviewAttemptEntity}.
     */
    @ManyToOne(
        () => EnrollmentEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "enrollment_id",
        foreignKeyConstraintName: "fk_enrollment_id_mock_interview_attempts",
    })
        enrollment: EnrollmentEntity

    /** Owning enrollment id. */
    @Column({
        name: "enrollment_id",
        type: "uuid",
    })
    @RelationId(
        (attempt: MockInterviewAttemptEntity) => attempt.enrollment,
    )
        enrollmentId: string

    /**
     * Client-generated id for this interview run. Plain string (not a FK) so a
     * retried/duplicate grade call is idempotent-detectable by the caller; not
     * unique-constrained here because Pha 1 does not yet dedupe (the FE only
     * calls grade once per session).
     */
    @Column({
        name: "session_id",
        type: "uuid",
    })
        sessionId: string

    /**
     * The system the learner designed. Pha 1: a `milestone_tasks.id` (curated
     * capstone). Plain string (not a FK) because Pha 3 adds AI-generated
     * "classic" prompts that have no milestone-task row — this column stores
     * whatever prompt id `mockInterviewPrompts` handed the client back.
     */
    @Column({
        name: "prompt_id",
        type: "varchar",
    })
        promptId: string

    /** Snapshot of the prompt's title, for history display without a join. */
    @Column({
        name: "prompt_title",
        type: "varchar",
    })
        promptTitle: string

    /** Seniority level the session was graded against, or null (any level). */
    @Column({
        name: "level",
        type: "varchar",
        nullable: true,
    })
        level: string | null

    /** Integer 0–100 overall score the model assigned to the whole session. */
    @Column({
        name: "overall_score",
        type: "int",
    })
        overallScore: number

    /** Coarse verdict band — "pass" / "borderline" / "fail" (bussiness `InterviewVerdict`). */
    @Column({
        name: "verdict",
        type: "varchar",
    })
        verdict: string

    /**
     * Per-phase score breakdown — `[{ phase, score, max }]` for each of the 5
     * canonical phases (requirements / estimation / highLevel / deepDive /
     * tradeoffs). Kept as jsonb (not typed columns) so a phase can be added
     * without a migration — the scorecard reads this array directly.
     */
    @Column({
        name: "phase_scores",
        type: "jsonb",
        default: () => "'[]'",
    })
        phaseScores: Array<Record<string, unknown>>

    /**
     * Per-attribute score breakdown — `[{ key, score }]` for named evaluation
     * attributes (communication, structured thinking, …). jsonb for the same
     * schema-evolution reason as {@link phaseScores}.
     */
    @Column({
        name: "attribute_scores",
        type: "jsonb",
        default: () => "'[]'",
    })
        attributeScores: Array<Record<string, unknown>>

    /** Concrete things done right, for the scorecard + history detail. */
    @Column({
        name: "strengths",
        type: "jsonb",
        default: () => "'[]'",
    })
        strengths: Array<string>

    /** Concrete gaps to address, for the scorecard + history detail. */
    @Column({
        name: "gaps",
        type: "jsonb",
        default: () => "'[]'",
    })
        gaps: Array<string>

    /** A follow-up an interviewer would ask next, or null. */
    @Column({
        name: "follow_up_question",
        type: "varchar",
        nullable: true,
    })
        followUpQuestion: string | null

    /**
     * Distinct content (lesson) ids the RAG grounding excerpt was retrieved
     * from at grade time, in similarity order — snapshotted so a re-opened
     * past attempt (history) can still deep-link "study this" without
     * re-running retrieval. A plain jsonb string array (not a FK/relation):
     * the course's content tree can change after grading, and this is a
     * point-in-time snapshot of what grounded THIS grade, not a live
     * reference. Empty array when retrieval missed/failed/index absent at
     * grade time.
     */
    @Column({
        name: "matched_content_ids",
        type: "jsonb",
        default: () => "'[]'",
    })
        matchedContentIds: Array<string>
}
