import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "One tag's full review-retention breakdown (worst first).",
})
/** One tag's full review-retention breakdown, worst-first. */
export class FlashcardWeakTag {
    @Field(() => String, { description: "The technology tag (e.g. NestJS)." })
        tag: string

    @Field(() => Int, { description: "Retention for this tag = graded Good/Easy / total graded, 0..100." })
        retention: number

    @Field(() => Int, { description: "Distinct cards (not reviews) carrying this tag that were graded at least once." })
        cardCount: number
}

@ObjectType({
    description: "A reason-tagged leech card (lapsed vs stuck-on-Hard), for the 'viết lại' fix-list.",
})
/** A "leech FOCUS" card — the card the learner keeps forgetting or getting stuck on. */
export class FlashcardLeechFocusCard {
    @Field(() => ID, { description: "The card id (open it in the reviewer)." })
        cardId: string

    @Field(() => String, { description: "The card's question text (default-locale snapshot)." })
        question: string

    @Field(() => ID, { description: "Owning deck id (deep-link target)." })
        deckId: string

    @Field(() => String, { description: "Owning deck title." })
        deckTitle: string

    @Field(() => Int, { description: "Times this card exhibited its reason (Again-after-a-prior-recall count, or repeated-Hard count)." })
        lapseCount: number

    @Field(() => String, { description: "\"lapsed\" = forgot after once recalling it; \"stuckHard\" = repeatedly graded Hard." })
        reason: "lapsed" | "stuckHard"
}

@ObjectType({
    description: "One deck's review retention (outcome), weakest first.",
})
/** One deck's review RETENTION (recalled/total) — the outcome analogue of the footprint `byDeck`. */
export class FlashcardDeckRetention {
    @Field(() => ID, { description: "The deck this retention is scoped to." })
        deckId: string

    @Field(() => String, { description: "The deck's title." })
        deckTitle: string

    @Field(() => Int, { description: "Retention = graded Good/Easy / total graded for this deck, 0..100." })
        retention: number

    @Field(() => Int, { description: "Total graded reviews for this deck." })
        reviewCount: number
}

@ObjectType({
    description: "The viewer's aggregated flashcard review stats for one course.",
})
/**
 * The viewer's aggregated flashcard review ("Học thẻ") stats for one course —
 * the memory-health hero (mature/young retention) + weak-topic map, rendered
 * by `FlashcardReviewStats` (`stats-canonical-fold` — 1 hero + 1 zone).
 */
export class MyFlashcardReviewStatsData {
    @Field(
        () => [FlashcardLeechFocusCard],
        {
            description: "Reason-tagged leech cards (lapsed vs stuck-on-Hard), worst first — the 'viết lại' fix-list.",
        },
    )
        leechFocus: Array<FlashcardLeechFocusCard>

    @Field(
        () => [FlashcardWeakTag],
        {
            description: "EVERY tag's review retention, worst first.",
        },
    )
        weakTags: Array<FlashcardWeakTag>

    @Field(
        () => Int,
        {
            description: "Review retention for cards with interval_days >= 21 (recall on already-committed cards), 0..100.",
        },
    )
        matureRetention: number

    @Field(
        () => Int,
        {
            description: "Review retention for cards with interval_days < 21 (recall while still spacing a card out), 0..100.",
        },
    )
        youngRetention: number

    @Field(
        () => Int,
        {
            description: "Graded review events for THIS COURSE only — the course-scoped sibling of the per-user lifetime totalReviewed; the stats tab's empty-state floor must count this, not lifetime.",
        },
    )
        reviewedTotal: number

    @Field(
        () => Int,
        {
            description: "Review retention for THIS COURSE only (0..100) — what the memory-health hero shows, instead of the per-user lifetime retentionRate that blends every course.",
        },
    )
        courseRetention: number

    @Field(
        () => [FlashcardDeckRetention],
        {
            description: "Per-deck review retention (outcome), weakest first.",
        },
    )
        deckRetention: Array<FlashcardDeckRetention>
}

@ObjectType({
    description: "Response wrapper for the myFlashcardReviewStats query.",
})
/**
 * Response wrapper for the myFlashcardReviewStats query.
 */
export class MyFlashcardReviewStatsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyFlashcardReviewStatsData>
{
    @Field(
        () => MyFlashcardReviewStatsData,
        {
            nullable: true,
            description: "The viewer's aggregated flashcard review stats for one course.",
        },
    )
        data: MyFlashcardReviewStatsData
}
