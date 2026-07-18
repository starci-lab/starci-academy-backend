import {
    Field,
    Float,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

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

/** How many of the course's technology tags the learner has attempted at least once, vs how many exist. */
@ObjectType({
    description: "Distinct tags attempted vs distinct tags existing in this course.",
})
export class FlashcardQuizStatsConceptCoverage {
    @Field(() => Int, { description: "Distinct tags touched by at least one scanned quiz session's cards." })
        covered: number

    @Field(() => Int, { description: "Distinct tags across every card in this course's decks." })
        total: number
}

/**
 * The viewer's aggregated flashcard quick-quiz ("Hỏi nhanh") stats for one
 * course — the coverage-vs-target hero + weak-topic map that
 * `FlashcardQuizStats` renders (`stats-canonical-fold` — 1 hero + 1 zone).
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
        () => [FlashcardQuizStatsTagItem],
        {
            description: "Per-tag aggregate coverage across the scanned sessions, ranked by coverage descending.",
        },
    )
        byTag: Array<FlashcardQuizStatsTagItem>

    @Field(
        () => FlashcardQuizStatsConceptCoverage,
        {
            nullable: true,
            description: "Distinct tags attempted vs distinct tags existing in this course, or null when the course has no tag data at all.",
        },
    )
        conceptCoverage: FlashcardQuizStatsConceptCoverage | null
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
