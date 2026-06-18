import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * A user's flashcard study stats, derived from the `flashcard_review_events` log
 * via the per-user CQRS projection.
 */
@ObjectType({
    description: "A user's flashcard study stats (streak / retention / totals).",
})
export class MyFlashcardStatsData {
    @Field(
        () => Int,
        {
            description: "Consecutive review days (VN) up to today/yesterday; 0 if lapsed.",
        },
    )
        currentStreak: number

    @Field(
        () => Int,
        {
            description: "Longest-ever run of consecutive review days (VN).",
        },
    )
        longestStreak: number

    @Field(
        () => Int,
        {
            description: "Percent of reviews recalled (grade >= 2), 0–100.",
        },
    )
        retentionRate: number

    @Field(
        () => Int,
        {
            description: "Total reviews ever graded.",
        },
    )
        totalReviewed: number

    @Field(
        () => String,
        {
            nullable: true,
            description: "ISO timestamp of the most recent review, or null when never reviewed.",
        },
    )
        lastReviewedAt: string | null
}

/**
 * Response wrapper for the myFlashcardStats query.
 */
@ObjectType({
    description: "Response wrapper for the myFlashcardStats query.",
})
export class MyFlashcardStatsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyFlashcardStatsData> {
    @Field(
        () => MyFlashcardStatsData,
        {
            nullable: true,
            description: "The viewer's flashcard study stats.",
        },
    )
        data: MyFlashcardStatsData
}
