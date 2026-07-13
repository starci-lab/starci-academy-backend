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

/** One point on the coverage/XP trend line, oldest-of-the-recent-window first. */
@ObjectType({
    description: "One point on the viewer's flashcard quick-quiz coverage/XP trend line.",
})
export class FlashcardQuizStatsTrendPoint {
    @Field(
        () => String,
        {
            description: "ISO timestamp of when the session behind this point completed.",
        },
    )
        completedAt: string

    @Field(
        () => Float,
        {
            description: "The session's coverage, 0..1 (0 when never snapshotted).",
        },
    )
        coverage: number

    @Field(
        () => Int,
        {
            description: "XP granted for the session.",
        },
    )
        xpEarned: number
}

/** One technology tag's aggregate coverage across the scanned sessions. */
@ObjectType({
    description: "One technology tag's aggregate coverage across the viewer's scanned quiz sessions.",
})
export class FlashcardQuizStatsTagItem {
    @Field(
        () => String,
        {
            description: "The technology tag (e.g. \"NestJS\", \"Redis\").",
        },
    )
        tag: string

    @Field(
        () => Float,
        {
            description: "Aggregate coverage for this tag across every scanned session's cards carrying it, 0..1.",
        },
    )
        coverage: number
}

/** One tag's most-recent weak-spot occurrence, carrying a study deep-link back to its source module/content. */
@ObjectType({
    description: "One weak tag from the viewer's scanned quiz sessions, carrying a study deep-link.",
})
export class FlashcardQuizWeakTagLink {
    @Field(
        () => String,
        {
            description: "The technology tag (e.g. \"NestJS\", \"Redis\").",
        },
    )
        tag: string

    @Field(
        () => Float,
        {
            description: "This tag's coverage on its most recent occurrence across the scanned sessions, 0..1.",
        },
    )
        coverage: number

    @Field(
        () => ID,
        {
            nullable: true,
            description: "The single module this tag's cards map back to; null when the deck-to-module mapping was ambiguous.",
        },
    )
        moduleId: string | null

    @Field(
        () => ID,
        {
            nullable: true,
            description: "The single content (lesson) this tag's cards map back to; null when the deck-to-content mapping was ambiguous.",
        },
    )
        contentId: string | null
}

/** One "hard" quiz card — the quiz analogue of a review leech, lowest per-card coverage first. */
@ObjectType({
    description: "One card the viewer keeps under-answering in quizzes, carrying a deep-link to study it.",
})
export class FlashcardQuizStatsHardCard {
    @Field(
        () => ID,
        {
            description: "The card id (deep-link target).",
        },
    )
        cardId: string

    @Field(
        () => String,
        {
            description: "The card's question text (default-locale snapshot).",
        },
    )
        question: string

    @Field(
        () => Int,
        {
            description: "Times this card was answered across the scanned quiz sessions (sample size).",
        },
    )
        attempts: number

    @Field(
        () => Int,
        {
            description: "Times this card was answered with at least one blank wrong (coverage < 1).",
        },
    )
        wrongCount: number

    @Field(
        () => Float,
        {
            description: "Aggregate coverage for this card across attempts, 0..1 (ranking key).",
        },
    )
        coverage: number

    @Field(
        () => ID,
        {
            description: "Owning deck id (deep-link target).",
        },
    )
        deckId: string

    @Field(
        () => String,
        {
            description: "Owning deck title.",
        },
    )
        deckTitle: string
}

/** One deck's aggregate practice footprint across the scanned sessions. */
@ObjectType({
    description: "One deck's aggregate practice footprint across the viewer's scanned quiz sessions.",
})
export class FlashcardQuizStatsDeckItem {
    @Field(
        () => ID,
        {
            description: "The deck this aggregate is scoped to.",
        },
    )
        deckId: string

    @Field(
        () => String,
        {
            description: "The deck's title.",
        },
    )
        deckTitle: string

    @Field(
        () => Int,
        {
            description: "Distinct scanned sessions that touched this deck (a deck answered twice in one session still counts once).",
        },
    )
        sessionCount: number

    @Field(
        () => Int,
        {
            description: "Total card-answers (not unique cards) touching this deck across the scanned sessions.",
        },
    )
        cardsAnswered: number

    @Field(
        () => Int,
        {
            description: "This deck's total card count.",
        },
    )
        totalCards: number
}

/**
 * The viewer's aggregated flashcard quick-quiz ("Hỏi nhanh") stats for one
 * course — "history + stats" (2026-07-08).
 */
@ObjectType({
    description: "The viewer's aggregated flashcard quick-quiz stats for one course.",
})
export class MyFlashcardQuizStatsData {
    @Field(
        () => Boolean,
        {
            description: "True when the viewer has scanned fewer than the minimum completed quiz sessions for a trustworthy aggregate.",
        },
    )
        insufficientData: boolean

    @Field(
        () => [FlashcardQuizStatsTrendPoint],
        {
            description: "Coverage/XP trend across the most recent sessions (bounded, oldest of the window first).",
        },
    )
        trend: Array<FlashcardQuizStatsTrendPoint>

    @Field(
        () => [FlashcardQuizStatsTagItem],
        {
            description: "Per-tag aggregate coverage across the scanned sessions, ranked by coverage descending.",
        },
    )
        byTag: Array<FlashcardQuizStatsTagItem>

    @Field(
        () => [FlashcardQuizStatsDeckItem],
        {
            description: "Per-deck aggregate practice footprint across the scanned sessions.",
        },
    )
        byDeck: Array<FlashcardQuizStatsDeckItem>

    @Field(
        () => [FlashcardQuizWeakTagLink],
        {
            description: "Weakest tags with a study deep-link, each tag's most recent occurrence, ranked coverage ascending.",
        },
    )
        weakTagLinks: Array<FlashcardQuizWeakTagLink>

    @Field(
        () => [FlashcardQuizStatsHardCard],
        {
            description: "Cards the viewer keeps under-answering (lowest coverage), hardest first — the \"câu hay sai\" diagnosis.",
        },
    )
        hardCards: Array<FlashcardQuizStatsHardCard>

    @Field(
        () => Int,
        {
            description: "Completed quiz sessions scanned — a raw count for the \"N phiên\" tile.",
        },
    )
        completedSessionCount: number
}

/**
 * Response wrapper for the myFlashcardQuizStats query.
 */
@ObjectType({
    description: "Response wrapper for the myFlashcardQuizStats query.",
})
export class MyFlashcardQuizStatsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyFlashcardQuizStatsData>
{
    @Field(
        () => MyFlashcardQuizStatsData,
        {
            nullable: true,
            description: "The viewer's aggregated flashcard quick-quiz stats for one course.",
        },
    )
        data: MyFlashcardQuizStatsData
}
