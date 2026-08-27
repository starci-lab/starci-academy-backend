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

@Entity("mock_interview_attempts")
// fast scan of a user's mock-interview history, optionally scoped to a course
// (enrollment already scopes to one course x user, so the composite mirrors
// InterviewAttemptEntity's user+deck index)
@Index("idx_mock_interview_attempts_enrollment",
    [
        "enrollmentId",
    ])
@Index("uq_mock_interview_attempts_session_id",
    [
        "sessionId",
    ],
    {
        unique: true,
    })
/**
 * One graded mock-interview SESSION (not one question -- the whole 5-phase
 * interview is graded once, at the end). Mirrors {@link import("./interview-attempt.entity").InterviewAttemptEntity}'s
 * append-only-log shape, but the unit is a full interview run rather than a
 * single flashcard answer: `phaseScores` + `attributeScores` carry the rubric
 * breakdown the scorecard renders, and `promptId` snapshots WHICH capstone
 * system (or, later, AI-generated classic) the learner designed.
 */
export class MockInterviewAttemptEntity extends UuidAbstractEntity {
    /**
     * Enrollment this interview session belongs to (user x course) -- the anchor
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
     * Client-generated id for this interview run. It is globally unique so one
     * completed session can own exactly one persisted grade even when requests
     * are retried or arrive concurrently on different application replicas.
     */
    @Column({
        name: "session_id",
        type: "uuid",
    })
        sessionId: string

    /**
     * The system the learner designed. Pha 1: a `milestone_tasks.id` (curated
     * capstone). Plain string (not a FK) because Pha 3 adds AI-generated
     * "classic" prompts that have no milestone-task row -- this column stores
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

    /**
     * The TOP-LEVEL flow this graded session ran -- a
     * {@link import("../enums/mock-interview-mode").MockInterviewMode} value
     * ("qna" | "design"), or null for an attempt graded before the "mode
     * split" (2026-07-06) -- history readers treat a null `mode` as "design"
     * (the only mode that existed then). Each Q&A QUESTION's own cognitive
     * frame is NOT stored here (it lives on the session's `seed_questions`
     * snapshot at grade time, not re-persisted per attempt).
     */
    @Column({
        name: "mode",
        type: "varchar",
        nullable: true,
    })
        mode: string | null

    /** Rubric identity copied from the source session for comparable stats. */
    @Column({
        name: "rubric_version",
        type: "varchar",
        default: "mock-interview-v1",
    })
        rubricVersion: string

    /** Whether course recommendations were resolved, absent, or unavailable. */
    @Column({
        name: "recommendation_status",
        type: "varchar",
        default: "no_match",
    })
        recommendationStatus: "available" | "no_match" | "unavailable"

    /** Integer 0-100 overall score the model assigned to the whole session. */
    @Column({
        name: "overall_score",
        type: "int",
    })
        overallScore: number

    /** Coarse verdict band -- "pass" / "borderline" / "fail" (bussiness `InterviewVerdict`). */
    @Column({
        name: "verdict",
        type: "varchar",
    })
        verdict: string

    /**
     * Per-phase score breakdown -- `[{ phase, score, max }]` for each of the 5
     * canonical phases (requirements / estimation / highLevel / deepDive /
     * tradeoffs). Kept as jsonb (not typed columns) so a phase can be added
     * without a migration -- the scorecard reads this array directly.
     */
    @Column({
        name: "phase_scores",
        type: "jsonb",
        default: () => "'[]'",
    })
        phaseScores: Array<Record<string, unknown>>

    /**
     * Per-attribute score breakdown -- `[{ key, score }]` for named evaluation
     * attributes (communication, structured thinking, ...). jsonb for the same
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
     * from at grade time, in similarity order -- snapshotted so a re-opened
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

    /**
     * Per-question model-answer review -- one entry per `mode="qna"` question,
     * `[{ questionIndex, kind, question, candidateAnswer, modelAnswer,
     * feedback, score, max, matchedContentId }]` (see
     * {@link import("../../../../../features/api/core/graphql/mutations/interview/grade-mock-interview-session/types/mock-interview-grade").MockInterviewQuestionReview}
     * for the full shape) -- the anti-ChatGPT feature: pairs the candidate's
     * own answer against the course's authored answer for the exact same
     * flashcard seed. Always empty for `mode="design"` (no single seed
     * flashcard to source a model answer from). jsonb (not typed columns) for
     * the same schema-evolution reason as every other breakdown column on
     * this entity; defaults to an empty array so every attempt written before
     * this column existed reads back as "no per-question review available"
     * rather than null.
     */
    @Column({
        name: "question_reviews",
        type: "jsonb",
        default: () => "'[]'",
    })
        questionReviews: Array<Record<string, unknown>>

    /**
     * Whether THIS graded attempt should feed job-readiness's rolling
     * mock-interview average -- "configurable setup" (2026-07-06): copied
     * verbatim from the session row's own
     * {@link import("./mock-interview-session.entity").MockInterviewSessionEntity.countsToReadiness}
     * at grade time (true for Auto/design, false for a Configurable
     * qna draw). {@link import("../../../../../features/api/core/graphql/queries/users/job-readiness/job-readiness.service").JobReadinessService}'s
     * recent-window average query MUST filter `WHERE counts_to_readiness =
     * true` so deliberate, learner-picked practice never dilutes the exam-like
     * signal. Defaults true so every row written before this column existed
     * still counts.
     */
    @Column({
        name: "counts_to_readiness",
        type: "boolean",
        default: true,
    })
        countsToReadiness: boolean

    /**
     * Optional user-chosen name for the practice session this attempt was
     * graded from, copied verbatim from
     * {@link import("./mock-interview-session.entity").MockInterviewSessionEntity.name}
     * at grade time -- so the history row keeps the name even after the
     * source session's 24h resume TTL expires. Null when the learner didn't
     * name the session -- the FRONTEND renders a time-based fallback label in
     * that case (the server never invents one).
     */
    @Column({
        name: "name",
        type: "text",
        nullable: true,
    })
        name: string | null
}
