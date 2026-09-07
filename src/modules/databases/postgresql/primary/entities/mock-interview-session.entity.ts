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
    Locale,
} from "../enums/locale"

/**
 * Max wall-clock duration ONE mock-interview session's live interview loop
 * may run, from the moment the server drew it ({@link MockInterviewSessionEntity.createdAt}) --
 * uniform across `mode="qna"` and `mode="design"` (2026-07-08 "session time
 * limit" ruling). Enforced server-side at ask-time
 * ({@link import("../../../../../features/socketio/core/mock-interview/mock-interview.gateway").MockInterviewGateway.handleAskMockInterviewTurn}),
 * never trusted from the client -- a client-side countdown is DERIVED from
 * `createdAt + this duration`, not the other way around. Does NOT gate
 * `gradeMockInterviewSession` (a slightly-late final answer must still be
 * gradable -- the limit governs the ASK loop, not the grade call).
 */
export const MOCK_INTERVIEW_SESSION_DURATION_MS = 60 * 60 * 1000

/** Version of the scoring rubric snapshotted by newly-created sessions. */
export const CURRENT_MOCK_INTERVIEW_RUBRIC_VERSION = "mock-interview-v1"

/** Durable lifecycle states for one mock-interview practice session. */
export type MockInterviewSessionStatus =
    | "in_progress"
    | "grading"
    | "grading_failed"
    | "completed"
    | "abandoned"
    | "expired"

/** One authored programming-language variant of a seed question's GIVEN code. */
export interface MockInterviewSeedQuestionGivenCode {
    lang: string
    code: string
}

/**
 * One drawn question SEED for a `mode="qna"` session -- one
 * `flashcard_cards.id` PLUS the cognitive frame ({@link import("../enums/mock-interview-kind").MockInterviewKind})
 * that was RANDOMLY assigned to it at draw time ("mode split", 2026-07-06).
 * Every question in a Q&A session gets its OWN kind (not one kind shared by
 * the whole session), so the transcript can be framed/graded per-question.
 * Stored as a plain jsonb object (not typed columns) inside
 * {@link MockInterviewSessionEntity.seedQuestions} -- schema-evolution
 * friendly, same reasoning as every other jsonb column on this entity.
 */
export interface MockInterviewSeedQuestion {
    /** The seed `flashcard_cards.id`. */
    cardId: string
    /** The cognitive frame this ONE question is asked in -- a {@link import("../enums/mock-interview-kind").MockInterviewKind} value. */
    kind: string
    /** Short title/snippet identifying the seed topic (the card's question, truncated). */
    title: string
    /**
     * GIVEN code the candidate should FIX/read (interview-bank `debug`/`review`/
     * `optimize` questions only), one entry per authored programming-language
     * variant -- snapshotted here (not re-derived at resume time) so
     * `myInProgressMockInterviewSession` can re-seed the editable code tool on
     * resume exactly as it was first delivered. Empty array for every other
     * kind/source.
     */
    givenCodes: Array<MockInterviewSeedQuestionGivenCode>
}

/**
 * One recorded turn of an IN-FLIGHT session's transcript, snapshotted onto
 * {@link MockInterviewSessionEntity.turns} by `syncMockInterviewSessionTurns`
 * so the conversation can be replayed exactly when the learner resumes --
 * mirrors the shape of `gradeMockInterviewSession`'s
 * `MockInterviewTurnInput` (and the FE's own `MockInterviewTurn`) field for
 * field, since the eventual grade call re-sends this same transcript. Stored
 * as a plain jsonb array (not typed columns), same reasoning as every other
 * jsonb column on this entity.
 */
export interface MockInterviewSessionTurn {
    /** Who spoke this turn -- "interviewer" or "candidate". */
    role: string
    /** Which of the 5 canonical interview phases this turn belongs to (mode="design" only -- carries no meaning for a "qna" turn). */
    phase: string
    /** The turn's Markdown content (candidate turns are speech-to-text transcribed client-side). */
    content: string
    /** 0-based index of the question this turn belongs to (mode="qna" only) -- undefined/omitted for a "design" turn. */
    questionIndex?: number
    /**
     * Set on an interviewer turn whose question shipped GIVEN code that was
     * seeded into the editable code tool -- lets a resumed session re-render
     * the "code loaded into the editor" chip instead of the code inline,
     * matching what the learner originally saw.
     */
    artifactHint?: "code"
}

@Entity("mock_interview_sessions")
// fast per-enrollment session lookup (mirrors the attempts table's index) --
// not the primary lookup path (that's by `id`), but useful for cleanup/debug
// queries scoped to one enrollment
@Index("idx_mock_interview_sessions_enrollment",
    [
        "enrollmentId",
    ])
@Index("uq_mock_interview_sessions_unfinished_enrollment",
    [
        "enrollmentId",
    ],
    {
        unique: true,
        where: "\"status\" IN ('in_progress', 'grading', 'grading_failed')",
    })
/**
 * One SERVER-PICKED mock-interview prompt draw -- created by
 * `startMockInterviewSession` at the moment the learner starts a session, so
 * `gradeMockInterviewSession` can look the draw back up by `id` and grade
 * against the prompt/level the SERVER actually handed out rather than trusting
 * whatever the client echoes back (Pha 2 integrity fix). Mirrors
 * {@link import("./mock-interview-attempt.entity").MockInterviewAttemptEntity}'s
 * shape for the identity columns (`promptId` / `promptTitle` / `level`), but is
 * a much thinner, PRE-grade row -- no scorecard, just the draw itself.
 */
export class MockInterviewSessionEntity extends UuidAbstractEntity {
    /**
     * Enrollment this session draw belongs to (user x course) -- the anchor
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
     * The prompt the SERVER drew for this session -- either a
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
     * (the draw still happened -- it just fell back to "middle" for pool
     * selection, matched by an equivalent nullable column shape as
     * {@link import("./mock-interview-attempt.entity").MockInterviewAttemptEntity.level}).
     */
    @Column({
        name: "level",
        type: "varchar",
        nullable: true,
    })
        level: string | null

    /**
     * Programming language CHOSEN at session start (the setup screen's language
     * picker). Code questions (debug/review/optimize with per-language `bodies/`)
     * were drawn + are graded in THIS language: the delivered prompt/givenCode and
     * the grading `idealAnswer` all resolve to this language's body. Null for a
     * legacy session or a session with no code questions. Free-form varchar
     * ("typescript" | "java" | "csharp" | "go").
     */
    @Column({
        name: "lang",
        type: "varchar",
        nullable: true,
    })
        lang: string | null

    /** UI locale captured when the session starts and reused by durable grading. */
    @Column({
        name: "locale",
        type: "varchar",
        default: Locale.En,
    })
        locale: Locale

    /** Difficulty tier the drawn prompt belongs to ("easy" | "medium" | "hard"). */
    @Column({
        name: "difficulty",
        type: "varchar",
    })
        difficulty: string

    /** Where the drawn prompt came from -- "capstone" or "classic". */
    @Column({
        name: "source",
        type: "varchar",
    })
        source: string

    /**
     * The TOP-LEVEL flow this session runs -- a
     * {@link import("../enums/mock-interview-mode").MockInterviewMode} value
     * ("qna" | "design"). "Mode split" (2026-07-06): this used to be a
     * per-session `kind` (theory/reasoning/scenario/design); it is now just
     * "qna" (N random-kind questions) or "design" (the unchanged 5-phase
     * flow) -- each Q&A QUESTION's own cognitive frame lives on
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
     * For `mode="qna"` -- the drawn question seeds, in the order they will be
     * asked, EACH carrying its own RANDOMLY-assigned cognitive frame (see
     * {@link MockInterviewSeedQuestion}). Null/empty for a "design" session
     * (it has no flashcard seeds -- its prompt is a capstone/classic system,
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
     * job-readiness's rolling mock-interview average -- "configurable setup"
     * (2026-07-06): true for an Auto qna draw and every "design"
     * draw, false for a Configurable qna draw (learner-picked
     * question count/kinds must never inflate/dilute the readiness signal,
     * which is meant to read like a random exam). Defaults true so every row
     * written before this column existed still counts (they could only ever
     * have been Auto/design draws). Snapshotted here -- NOT re-derived at
     * grade time -- purely so `gradeMockInterviewSession` can copy it onto the
     * persisted {@link import("./mock-interview-attempt.entity").MockInterviewAttemptEntity}
     * without re-deriving "was this a configurable draw" from anything else.
     */
    @Column({
        name: "counts_to_readiness",
        type: "boolean",
        default: true,
    })
        countsToReadiness: boolean

    /**
     * The session's lifecycle state -- "resume mock interview session"
     * (2026-07-08): a learner who navigates away mid-session can pick their
     * draw back up via `myInProgressMockInterviewSession` /
     * `syncMockInterviewSessionTurns` as long as it is still "in_progress".
     * `startMockInterviewSession` flips any PRIOR "in_progress" row for the
     * same enrollment to "abandoned" before persisting a new draw (so a
     * learner never has two resumable sessions at once), and
     * `gradeMockInterviewSession` flips the row to "completed" once grading
     * succeeds. Plain varchar (not a pg enum), same reasoning as every other
     * free-form column on this entity (`level`/`source`/`mode`). Defaults to
     * "in_progress" so a row written before this column existed still reads
     * as a valid status (see the migration's own doc for why that default is
     * safe -- those rows are all already resolved one way or another in
     * practice, "in_progress" is just their fallback label).
     *
     * A session left "in_progress" past {@link MOCK_INTERVIEW_SESSION_DURATION_MS}
     * is effectively timed out -- "session lazy-expiry" (2026-07-11): there is
     * NO cron flipping it to a 4th persisted value, every reader instead
     * derives "timed out" at READ time from `status === "in_progress" &&
     * createdAt + MOCK_INTERVIEW_SESSION_DURATION_MS < now` (see
     * `myInProgressMockInterviewSession`, which simply excludes it from the
     * resumable result). The row only actually flips to "abandoned" once the
     * SAME enrollment starts a fresh draw (unchanged).
     */
    @Column({
        name: "status",
        type: "varchar",
        default: "in_progress",
    })
        status: MockInterviewSessionStatus

    /** Optimistic concurrency token used by transcript and lifecycle mutations. */
    @Column({
        name: "revision",
        type: "int",
        default: 0,
    })
        revision: number

    /** Immutable rubric identity used to keep cross-session comparisons valid. */
    @Column({
        name: "rubric_version",
        type: "varchar",
        default: CURRENT_MOCK_INTERVIEW_RUBRIC_VERSION,
    })
        rubricVersion: string

    /** Server-owned deadline for the live question loop. */
    @Column({
        name: "expires_at",
        type: "timestamptz",
    })
        expiresAt: Date

    /** When completion atomically handed the session to durable grading. */
    @Column({
        name: "grading_requested_at",
        type: "timestamptz",
        nullable: true,
    })
        gradingRequestedAt: Date | null

    /** When a durable grade was committed. */
    @Column({
        name: "completed_at",
        type: "timestamptz",
        nullable: true,
    })
        completedAt: Date | null

    /** When the learner explicitly abandoned this session. */
    @Column({
        name: "abandoned_at",
        type: "timestamptz",
        nullable: true,
    })
        abandonedAt: Date | null

    /**
     * Snapshot of the in-flight transcript, periodically overwritten by
     * `syncMockInterviewSessionTurns` (never by `startMockInterviewSession`,
     * which always leaves this null on a fresh draw) -- the source a resumed
     * session replays from. Null for a session that never synced a turn yet
     * (drawn but not started, or predates this column).
     */
    @Column({
        name: "turns",
        type: "jsonb",
        nullable: true,
    })
        turns: Array<MockInterviewSessionTurn> | null

    /**
     * 0-based index of the "qna"-mode question the learner was on at the
     * last sync -- together with {@link phaseIndex}, the resume position
     * `myInProgressMockInterviewSession` reports back so the FE can restore
     * the workspace to exactly where the learner left off. Defaults to 0 (a
     * session always starts at its first question).
     */
    @Column({
        name: "question_index",
        type: "int",
        default: 0,
    })
        questionIndex: number

    /**
     * 0-based index of the "design"-mode phase (requirements -> estimation ->
     * highLevel -> deepDive -> tradeoffs) the learner was on at the last sync --
     * the design-flow counterpart of {@link questionIndex}. Defaults to 0 (a
     * session always starts at the first phase).
     */
    @Column({
        name: "phase_index",
        type: "int",
        default: 0,
    })
        phaseIndex: number

    /**
     * Optional user-chosen name for this practice session (e.g. "Round 2 -
     * Backend"), set at `startMockInterviewSession` time. Null when the
     * learner didn't name it -- the FRONTEND renders a time-based fallback
     * label in that case (the server never invents one).
     */
    @Column({
        name: "name",
        type: "text",
        nullable: true,
    })
        name: string | null
}
