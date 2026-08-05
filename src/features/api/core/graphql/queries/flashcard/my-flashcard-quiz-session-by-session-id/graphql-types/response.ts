import {
    Field,
    Float,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "A technology tag surfaced as weak on this quiz session, with its coverage and the module/content it maps to.",
})
/**
 * One weak-tag row snapshotted onto a finished quiz session — a technology tag
 * with its coverage across the session's cards carrying it, plus the module /
 * content it maps back to (null when the deck-to-module/content mapping is
 * ambiguous). Echoed verbatim from `flashcard_quiz_sessions.weak_tags`; feeds
 * the FE weak-tags chips + the "study this" links.
 */
export class FlashcardQuizSessionWeakTagData {
    @Field(
        () => String,
        {
            description: "The technology tag (e.g. \"NestJS\", \"Redis\") this coverage is scoped to.",
        },
    )
        tag: string

    @Field(
        () => Float,
        {
            description: "This tag's coverage across the session's cards carrying it, 0..1.",
        },
    )
        coverage: number

    @Field(
        () => ID,
        {
            nullable: true,
            description: "The single module this tag's cards map back to, or null when the deck-to-module mapping is ambiguous.",
        },
    )
        moduleId?: string

    @Field(
        () => ID,
        {
            nullable: true,
            description: "The single content (lesson) this tag's cards map back to, or null when the deck-to-content mapping is ambiguous.",
        },
    )
        contentId?: string
}

@ObjectType({
    description: "One card's per-card cloze-blank outcome within the quiz session.",
})
/**
 * One card's per-card outcome within the session — echoed verbatim from
 * `flashcard_quiz_sessions.results`. The FE re-fetches the card TEXT separately
 * by `cardId`; this only carries the correct/total cloze-blank counts.
 */
export class FlashcardQuizSessionResultData {
    @Field(
        () => ID,
        {
            description: "The flashcard this answer belongs to (the FE re-fetches the card text separately by this id).",
        },
    )
        cardId: string

    @Field(
        () => Int,
        {
            description: "How many cloze blanks on this card the learner filled correctly.",
        },
    )
        correctBlanks: number

    @Field(
        () => Int,
        {
            description: "Total cloze blanks on this card (the denominator for this card's coverage).",
        },
    )
        totalBlanks: number
}

@ObjectType({
    description: "The resolved recap (mode, level, coverage, xp, per-card + weak-tag breakdown) for one flashcard quiz session.",
})
/**
 * The resolved recap for ONE flashcard quick-quiz ("Hỏi nhanh") session,
 * resolved by its id alone REGARDLESS of status (completed/abandoned/
 * in_progress) and owner-scoped via the session's enrollment. Every field is
 * read STRAIGHT off the snapshotted `flashcard_quiz_sessions` row — nothing is
 * recomputed. The query resolves to `null` (not this type) when the id is not
 * found / not owned by the caller.
 */
export class MyFlashcardQuizSessionBySessionIdData {
    @Field(
        () => ID,
        {
            description: "Id of the session (echoes the input, for convenience).",
        },
    )
        sessionId: string

    @Field(
        () => String,
        {
            description: "The session's lifecycle state: \"in_progress\" | \"completed\" | \"abandoned\" (resolved regardless of status).",
        },
    )
        status: "in_progress" | "completed" | "abandoned"

    @Field(
        () => String,
        {
            description: "The practice mode chosen at setup: \"quick\" | \"deep\".",
        },
    )
        mode: "quick" | "deep"

    @Field(
        () => String,
        {
            nullable: true,
            description: "The FlashcardLevel filter chosen at setup (\"junior\"/\"middle\"/\"senior\"/\"staff\"), or null for \"all levels\".",
        },
    )
        level?: string

    @Field(
        () => Float,
        {
            nullable: true,
            description: "Server-derived aggregate coverage (0..1), null until the session is completed.",
        },
    )
        coverage?: number

    @Field(
        () => Int,
        {
            description: "XP actually granted this session (post daily-cap clamp); 0 for a never-completed draw.",
        },
    )
        xpEarned: number

    @Field(
        () => Int,
        {
            description: "Number of cards drawn for this session (= card_ids length).",
        },
    )
        cardCount: number

    @Field(
        () => Int,
        {
            description: "Number of cards answered so far (= results length).",
        },
    )
        answeredCount: number

    @Field(
        () => Int,
        {
            description: "Number of answered cards with EVERY cloze blank correct (correctBlanks === totalBlanks).",
        },
    )
        fullyCorrectCount: number

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Wall-clock span of the session (updatedAt − createdAt, seconds), or null when the row was never updated after creation.",
        },
    )
        durationSeconds?: number

    @Field(
        () => [FlashcardQuizSessionWeakTagData],
        {
            description: "Snapshot of the session's weak-tag ranking (verbatim from the row), empty when none.",
        },
    )
        weakTags: Array<FlashcardQuizSessionWeakTagData>

    @Field(
        () => [FlashcardQuizSessionResultData],
        {
            description: "Per-card breakdown (verbatim from the row), empty when nothing was answered.",
        },
    )
        results: Array<FlashcardQuizSessionResultData>
}

@ObjectType({
    description: "Response wrapper for the myFlashcardQuizSessionBySessionId query.",
})
/**
 * Response wrapper for the myFlashcardQuizSessionBySessionId query — `data` is
 * `null` when the session id is not found / not owned by the caller.
 */
export class MyFlashcardQuizSessionBySessionIdResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyFlashcardQuizSessionBySessionIdData>
{
    @Field(
        () => MyFlashcardQuizSessionBySessionIdData,
        {
            nullable: true,
            description: "The resolved quiz session recap, or null when the id is not found/not owned by the caller.",
        },
    )
        data: MyFlashcardQuizSessionBySessionIdData
}
