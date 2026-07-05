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
 * One drawn question SEED for a `mode="qna"` session — one
 * `flashcard_cards.id` PLUS the cognitive frame ({@link import("../enums/mock-interview-kind").MockInterviewKind})
 * that was RANDOMLY assigned to it at draw time ("mode split", 2026-07-06).
 * Every question in a Q&A session gets its OWN kind (not one kind shared by
 * the whole session), so the transcript can be framed/graded per-question.
 * Stored as a plain jsonb object (not typed columns) inside
 * {@link MockInterviewSessionEntity.seedQuestions} — schema-evolution
 * friendly, same reasoning as every other jsonb column on this entity.
 */
export interface MockInterviewSeedQuestion {
    /** The seed `flashcard_cards.id`. */
    cardId: string
    /** The cognitive frame this ONE question is asked in — a {@link import("../enums/mock-interview-kind").MockInterviewKind} value. */
    kind: string
    /** Short title/snippet identifying the seed topic (the card's question, truncated). */
    title: string
}

/**
 * One SERVER-PICKED mock-interview prompt draw — created by
 * `startMockInterviewSession` at the moment the learner starts a session, so
 * `gradeMockInterviewSession` can look the draw back up by `id` and grade
 * against the prompt/level the SERVER actually handed out rather than trusting
 * whatever the client echoes back (Pha 2 integrity fix). Mirrors
 * {@link import("./mock-interview-attempt.entity").MockInterviewAttemptEntity}'s
 * shape for the identity columns (`promptId` / `promptTitle` / `level`), but is
 * a much thinner, PRE-grade row — no scorecard, just the draw itself.
 */
@Entity("mock_interview_sessions")
// fast per-enrollment session lookup (mirrors the attempts table's index) —
// not the primary lookup path (that's by `id`), but useful for cleanup/debug
// queries scoped to one enrollment
@Index("idx_mock_interview_sessions_enrollment",
    [
        "enrollmentId",
    ])
export class MockInterviewSessionEntity extends UuidAbstractEntity {
    /**
     * Enrollment this session draw belongs to (user × course) — the anchor
     * `gradeMockInterviewSession` uses to scope its by-id lookup to the SAME
     * caller who started the session (a session row can never be graded on
     * behalf of a different enrollment).
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
        foreignKeyConstraintName: "fk_enrollment_id_mock_interview_sessions",
    })
        enrollment: EnrollmentEntity

    /** Owning enrollment id. */
    @Column({
        name: "enrollment_id",
        type: "uuid",
    })
    @RelationId(
        (session: MockInterviewSessionEntity) => session.enrollment,
    )
        enrollmentId: string

    /**
     * The prompt the SERVER drew for this session — either a
     * `milestone_tasks.id` (capstone) or a `MOCK_INTERVIEW_CLASSIC_PROMPTS`
     * slug (classic). Plain string (not a FK), same reasoning as
     * {@link import("./mock-interview-attempt.entity").MockInterviewAttemptEntity.promptId}:
     * classic prompts have no milestone-task row to reference.
     */
    @Column({
        name: "prompt_id",
        type: "varchar",
    })
        promptId: string

    /** Snapshot of the drawn prompt's title, so grading never has to re-look it up. */
    @Column({
        name: "prompt_title",
        type: "varchar",
    })
        promptTitle: string

    /**
     * Seniority level the session was requested at ("junior" | "middle" |
     * "senior"), or null when the caller omitted/sent an unrecognized value
     * (the draw still happened — it just fell back to "middle" for pool
     * selection, matched by an equivalent nullable column shape as
     * {@link import("./mock-interview-attempt.entity").MockInterviewAttemptEntity.level}).
     */
    @Column({
        name: "level",
        type: "varchar",
        nullable: true,
    })
        level: string | null

    /** Difficulty tier the drawn prompt belongs to ("easy" | "medium" | "hard"). */
    @Column({
        name: "difficulty",
        type: "varchar",
    })
        difficulty: string

    /** Where the drawn prompt came from — "capstone" or "classic". */
    @Column({
        name: "source",
        type: "varchar",
    })
        source: string

    /**
     * The TOP-LEVEL flow this session runs — a
     * {@link import("../enums/mock-interview-mode").MockInterviewMode} value
     * ("qna" | "design"). "Mode split" (2026-07-06): this used to be a
     * per-session `kind` (theory/reasoning/scenario/design); it is now just
     * "qna" (N random-kind questions) or "design" (the unchanged 5-phase
     * flow) — each Q&A QUESTION's own cognitive frame lives on
     * {@link seedQuestions} instead. Nullable so a session drawn before this
     * split still loads (treated as "design" by every reader, the only mode
     * that existed then). Plain varchar (not a pg enum), same reasoning as
     * every other free-form column on this entity.
     */
    @Column({
        name: "mode",
        type: "varchar",
        nullable: true,
    })
        mode: string | null

    /**
     * For `mode="qna"` — the drawn question seeds, in the order they will be
     * asked, EACH carrying its own RANDOMLY-assigned cognitive frame (see
     * {@link MockInterviewSeedQuestion}). Null/empty for a "design" session
     * (it has no flashcard seeds — its prompt is a capstone/classic system,
     * see {@link promptId}). Snapshotted here (not re-derived at grade time)
     * so grading can fetch the seed cards' authored `answer` + `:::chip`
     * keywords for any "theory"-kind question's coverage rubric even if the
     * learner's progress/module-reached set changes between start and grade.
     */
    @Column({
        name: "seed_questions",
        type: "jsonb",
        nullable: true,
    })
        seedQuestions: Array<MockInterviewSeedQuestion> | null

    /**
     * Whether the eventual graded attempt for THIS session should feed
     * job-readiness's rolling mock-interview average — "configurable setup"
     * (2026-07-06): true for a "Tự động" (Auto) qna draw and every "design"
     * draw, false for a "Tùy chỉnh" (Configurable) qna draw (learner-picked
     * question count/kinds must never inflate/dilute the readiness signal,
     * which is meant to read like a random exam). Defaults true so every row
     * written before this column existed still counts (they could only ever
     * have been Auto/design draws). Snapshotted here — NOT re-derived at
     * grade time — purely so `gradeMockInterviewSession` can copy it onto the
     * persisted {@link import("./mock-interview-attempt.entity").MockInterviewAttemptEntity}
     * without re-deriving "was this a configurable draw" from anything else.
     */
    @Column({
        name: "counts_to_readiness",
        type: "boolean",
        default: true,
    })
        countsToReadiness: boolean
}
