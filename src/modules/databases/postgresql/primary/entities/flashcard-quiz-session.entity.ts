import {
    Check,
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
import type {
    ClozeQuizItemSnapshot,
    ClozeQuizScoreSnapshot,
    ClozeQuizSelection,
} from "@modules/bussiness/flashcard/cloze/cloze-contract"

/**
 * Max wall-clock duration ONE flashcard quick-quiz session may
 * stay resumable, from the moment it was drawn ({@link FlashcardQuizSessionEntity.createdAt})
 * -- "session lazy-expiry" (2026-07-11), mirroring
 * {@link import("./mock-interview-session.entity").MOCK_INTERVIEW_SESSION_DURATION_MS}'s
 * own reasoning: a quiz run has no cron sweeping stale rows, so a session past
 * this window simply stops being offered as resumable
 * (`myInProgressFlashcardQuizSession` excludes it) and its status is derived
 * as "timed out" wherever it is read -- never written back by a scheduled job.
 * Correction 2026-07-11 (teacher): 60 minutes -- same window as mock-interview, instead
 * of the original 4h self-paced limit.
 */
export const FLASHCARD_QUIZ_SESSION_DURATION_MS = 60 * 60 * 1000

/**
 * One card's outcome within an IN-FLIGHT flashcard quick-quiz
 * session, snapshotted onto {@link FlashcardQuizSessionEntity.results} by
 * `syncFlashcardQuizSessionProgress` so a resumed session can restore exactly
 * what was already answered -- mirrors the shape `completeFlashcardQuizSession`
 * already accepts per-card (`QuizSessionAnswerRequest`), so the final
 * `completeFlashcardQuizSession` call re-sends this same per-card breakdown.
 * Stored as a plain jsonb array (not typed columns), same reasoning as every
 * other jsonb column on this entity -- schema-evolution friendly.
 */
export interface FlashcardQuizSessionResult {
    /** The flashcard this answer belongs to. */
    cardId: string
    /** How many cloze blanks on this card the learner filled correctly. */
    correctBlanks: number
    /** Total cloze blanks on this card (the denominator for this card's coverage). */
    totalBlanks: number
}

/**
 * One weak tag surfaced from a finished session, snapshotted onto
 * {@link FlashcardQuizSessionEntity.weakTags} at completion time -- mirrors
 * `QuizSessionWeakTagResult` in
 * `src/modules/bussiness/flashcard/types/flashcard-quiz-session.ts` exactly,
 * but is redeclared here so this entity file has no dependency on the
 * bussiness module.
 */
export interface FlashcardQuizSessionWeakTag {
    /** The technology tag (e.g. "NestJS", "Redis") this coverage is scoped to. */
    tag: string
    /** This tag's coverage across the session's cards carrying it, 0..1. */
    coverage: number
    /** The single module this tag's cards map back to; omitted when the deck-to-module mapping is ambiguous. */
    moduleId?: string
    /** The single content (lesson) this tag's cards map back to; omitted when the deck-to-content mapping is ambiguous. */
    contentId?: string
}

@Entity("flashcard_quiz_sessions")
@Check("chk_flashcard_quiz_v1_shape",
    `"contract_version" IS DISTINCT FROM 1 OR (
        "start_request_id" IS NOT NULL
        AND "start_request_fingerprint" ~ '^[0-9a-f]{64}$'
        AND jsonb_typeof("quiz_items") = 'array'
        AND jsonb_array_length("quiz_items") > 0
        AND jsonb_typeof("answer_state") = 'array'
        AND "answer_version" >= 0
    )`)
@Check("chk_flashcard_quiz_v1_completed_score",
    `"contract_version" IS DISTINCT FROM 1
        OR "status" <> 'completed'
        OR "score_snapshot" IS NOT NULL`)
@Index("uq_flashcard_quiz_active_enrollment",
    [
        "enrollmentId",
    ],
    {
        unique: true,
        where: "status = 'in_progress'",
    })
@Index("uq_flashcard_quiz_start_request",
    [
        "enrollmentId",
        "startRequestId",
    ],
    {
        unique: true,
        where: "start_request_id IS NOT NULL",
    })
// fast per-enrollment session lookup (mirrors mock_interview_sessions' own
// index) -- not the primary lookup path (that's by `id`), but useful for
// cleanup/debug queries scoped to one enrollment
@Index("idx_flashcard_quiz_sessions_enrollment",
    [
        "enrollmentId",
    ])
/**
 * One resumable draw of the flashcard quick-quiz flow --
 * "resume flashcard quiz session" (2026-07-08), mirroring the SAME
 * resumable-session shape as
 * {@link import("./mock-interview-session.entity").MockInterviewSessionEntity}:
 * `startFlashcardQuizSession` persists the drawn card set,
 * `syncFlashcardQuizSessionProgress` periodically snapshots the in-flight
 * position + per-card results so a learner who navigates away mid-quiz can
 * pick it back up via `myInProgressFlashcardQuizSession`, and
 * `completeFlashcardQuizSession` flips the row to "completed" once the XP
 * grant succeeds.
 */
export class FlashcardQuizSessionEntity extends UuidAbstractEntity {
    @Column({
        name: "contract_version",
        type: "int",
        nullable: true,
    })
        contractVersion: number | null

    @Column({
        name: "start_request_id",
        type: "uuid",
        nullable: true,
    })
        startRequestId: string | null

    @Column({
        name: "start_request_fingerprint",
        type: "char",
        length: 64,
        nullable: true,
    })
        startRequestFingerprint: string | null

    @Column({
        name: "quiz_items",
        type: "jsonb",
        nullable: true,
    })
        quizItems: Array<ClozeQuizItemSnapshot> | null

    @Column({
        name: "answer_state",
        type: "jsonb",
        default: () => "'[]'",
    })
        answerState: Array<ClozeQuizSelection>

    @Column({
        name: "answer_version",
        type: "int",
        default: 0,
    })
        answerVersion: number

    @Column({
        name: "score_snapshot",
        type: "jsonb",
        nullable: true,
    })
        scoreSnapshot: ClozeQuizScoreSnapshot | null

    @Column({
        name: "invalid_reason",
        type: "varchar",
        nullable: true,
    })
        invalidReason: string | null
    /**
     * Enrollment this quiz draw belongs to (user x course) -- the anchor every
     * ownership-scoped lookup (`syncFlashcardQuizSessionProgress`,
     * `myInProgressFlashcardQuizSession`, `completeFlashcardQuizSession`) uses
     * to make sure a session row is only ever read/mutated on behalf of the
     * SAME caller who started it.
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
        foreignKeyConstraintName: "fk_enrollment_id_flashcard_quiz_sessions",
    })
        enrollment: EnrollmentEntity

    /** Owning enrollment id. */
    @Column({
        name: "enrollment_id",
        type: "uuid",
    })
    @RelationId(
        (session: FlashcardQuizSessionEntity) => session.enrollment,
    )
        enrollmentId: string

    /**
     * The `flashcard_cards.id` set drawn for this session, in the order they
     * are asked -- snapshotted ONCE at `startFlashcardQuizSession` time (never
     * re-drawn on resume), so a resumed session always sees the SAME cards it
     * started with regardless of any later deck changes.
     */
    @Column({
        name: "card_ids",
        type: "jsonb",
    })
        cardIds: Array<string>

    /**
     * 0-based index of the card the learner was on at the last sync -- the
     * resume position `myInProgressFlashcardQuizSession` reports back so the
     * FE can restore the workspace to exactly where the learner left off.
     * Defaults to 0 (a session always starts at its first card).
     */
    @Column({
        name: "current_index",
        type: "int",
        default: 0,
    })
        currentIndex: number

    /**
     * Snapshot of the in-flight per-card results, periodically overwritten by
     * `syncFlashcardQuizSessionProgress` (never by `startFlashcardQuizSession`,
     * which always leaves this an empty array on a fresh draw) -- the source a
     * resumed session replays from, and the SAME per-card breakdown eventually
     * re-sent to `completeFlashcardQuizSession` for scoring. Defaults to an
     * empty array (not null) so a fresh draw's resume payload never has to
     * null-guard this field.
     */
    @Column({
        name: "results",
        type: "jsonb",
        nullable: true,
        default: () => "'[]'",
    })
        results: Array<FlashcardQuizSessionResult> | null

    /**
     * The practice mode chosen at setup ("quick" | "deep") -- set ONCE at
     * `startFlashcardQuizSession` time and never changes afterward; drives the
     * history/stats display ("Quick"/"Deep"). Defaults to "quick" so a row
     * written before this column existed still reads as a valid mode.
     */
    @Column({
        name: "mode",
        type: "varchar",
        default: "quick",
    })
        mode: "quick" | "deep"

    /**
     * The `FlashcardLevel` filter chosen at setup ("junior"/"middle"/"senior"/
     * "staff"), or null for "all levels". Plain varchar (not the pg enum) so
     * it can hold "all"-as-null without a schema dependency on
     * `FlashcardLevel`.
     */
    @Column({
        name: "level",
        type: "varchar",
        nullable: true,
    })
        level: string | null

    /**
     * The server-derived aggregate coverage (0..1) computed by
     * `FlashcardQuizSessionService.complete()`, snapshotted onto the row at
     * completion so `myFlashcardQuizHistory` never has to re-derive it from
     * the `results` jsonb.
     */
    @Column({
        name: "coverage",
        type: "real",
        nullable: true,
    })
        coverage: number | null

    /**
     * The XP actually granted this session (post daily-cap clamp),
     * snapshotted at completion so history doesn't need to join
     * `xp_histories`. Defaults to 0 (a fresh/never-completed draw grants
     * nothing).
     */
    @Column({
        name: "xp_earned",
        type: "int",
        default: 0,
    })
        xpEarned: number

    /**
     * Snapshot of the session's weak-tag ranking at completion time (same
     * shape `FlashcardQuizSessionService.computeWeakTags` returns), so
     * history can show weak topics per past session without re-deriving it.
     */
    @Column({
        name: "weak_tags",
        type: "jsonb",
        nullable: true,
        default: () => "'[]'",
    })
        weakTags: Array<FlashcardQuizSessionWeakTag> | null

    /**
     * The session's lifecycle state -- "resume flashcard quiz session"
     * (2026-07-08): a learner who navigates away mid-quiz can pick their draw
     * back up via `myInProgressFlashcardQuizSession` /
     * `syncFlashcardQuizSessionProgress` as long as it is still "in_progress".
     * `startFlashcardQuizSession` flips any PRIOR "in_progress" row for the
     * same enrollment to "abandoned" before persisting a new draw (so a
     * learner never has two resumable sessions at once), and
     * `completeFlashcardQuizSession` flips the row to "completed" once its XP
     * grant succeeds. Plain varchar (not a pg enum) -- same reasoning as
     * {@link import("./mock-interview-session.entity").MockInterviewSessionEntity.status}
     * (avoids the TypeORM `synchronize` `ADD VALUE` footgun on a pg enum type),
     * and uses the SAME 3 string values for consistency across both
     * resumable-session tables. Defaults to "in_progress" so a row written
     * before this column existed still reads as a valid status.
     *
     * A session left "in_progress" past {@link FLASHCARD_QUIZ_SESSION_DURATION_MS}
     * is effectively timed out -- "session lazy-expiry" (2026-07-11): there is
     * NO cron flipping it to a 4th persisted value, every reader instead
     * derives "timed out" at READ time from `status === "in_progress" &&
     * createdAt + FLASHCARD_QUIZ_SESSION_DURATION_MS < now` (see
     * `myInProgressFlashcardQuizSession`, which simply excludes it from the
     * resumable result). The row only actually flips to "abandoned" once the
     * SAME enrollment starts a fresh draw (unchanged).
     */
    @Column({
        name: "status",
        type: "varchar",
        default: "in_progress",
    })
        status: "in_progress" | "completed" | "abandoned"

    /**
     * Optional user-chosen name for this quick-quiz session
     * (e.g. "Review NestJS before interview"), set at `startFlashcardQuizSession`
     * time. Null when the learner didn't name it -- the FRONTEND renders a
     * time-based fallback label in that case (the server never invents one).
     */
    @Column({
        name: "name",
        type: "text",
        nullable: true,
    })
        name: string | null
}
