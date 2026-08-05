import {
    Field,
    Float,
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
    description: "One technology tag's aggregate coverage across the viewer's scanned quiz sessions.",
})
/** One technology tag's aggregate coverage across the scanned sessions. */
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

@ObjectType({
    description: "Distinct tags attempted vs distinct tags existing in this course.",
})
/** How many of the course's technology tags the learner has attempted at least once, vs how many exist. */
export class FlashcardQuizStatsConceptCoverage {
    @Field(() => Int,
        {
            description: "Distinct tags touched by at least one scanned quiz session's cards." 
        })
        covered: number

    @Field(() => Int,
        {
            description: "Distinct tags across every card in this course's decks." 
        })
        total: number
}

@ObjectType({
    description: "The viewer's aggregated flashcard quick-quiz stats for one course.",
})
/**
 * The viewer's aggregated flashcard quick-quiz stats for one
 * course -- the coverage-vs-target hero + weak-topic map that
 * `FlashcardQuizStats` renders (`stats-canonical-fold` -- 1 hero + 1 zone).
 */
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

@ObjectType({
    description: "Response wrapper for the myFlashcardQuizStats query.",
})
/**
 * Response wrapper for the myFlashcardQuizStats query.
 */
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
