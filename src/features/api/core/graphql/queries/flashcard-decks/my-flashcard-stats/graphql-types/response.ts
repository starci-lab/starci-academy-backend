import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Tally of graded reviews by SM-2 grade (Again/Hard/Good/Easy).",
})
/** Tally of graded reviews by SM-2 grade (Again/Hard/Good/Easy). */
export class FlashcardGradeDistribution {
    @Field(
        () => Int,
        {
            description: "Reviews graded \"Again\" (0) — forgotten.",
        },
    )
        again: number

    @Field(
        () => Int,
        {
            description: "Reviews graded \"Hard\" (1) — recalled with difficulty.",
        },
    )
        hard: number

    @Field(
        () => Int,
        {
            description: "Reviews graded \"Good\" (2) — recalled normally.",
        },
    )
        good: number

    @Field(
        () => Int,
        {
            description: "Reviews graded \"Easy\" (3) — recalled effortlessly.",
        },
    )
        easy: number
}

@ObjectType({
    description: "A user's flashcard study stats (streak / retention / totals).",
})
/**
 * A user's flashcard study stats, derived from the `flashcard_review_events` log
 * via the per-user CQRS projection.
 */
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

    @Field(
        () => FlashcardGradeDistribution,
        {
            description: "Tally of graded reviews by SM-2 grade (Again/Hard/Good/Easy).",
        },
    )
        gradeDistribution: FlashcardGradeDistribution
}

@ObjectType({
    description: "Response wrapper for the myFlashcardStats query.",
})
/**
 * Response wrapper for the myFlashcardStats query.
 */
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
