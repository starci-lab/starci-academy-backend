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

/**
 * Grading outcome for one card in a Test submission.
 */
@ObjectType({
    description: "Grading outcome for one card in a Test submission.",
})
export class QuizTestCardResultData {
    /**
     * Id of the graded card.
     */
    @Field(
        () => ID,
        {
            description: "Id of the graded card.",
        },
    )
        quizCardId: string

    /**
     * Option the learner selected.
     */
    @Field(
        () => ID,
        {
            description: "Option the learner selected.",
        },
    )
        selectedOptionId: string

    /**
     * Id of the correct option for this card (null if none flagged correct).
     */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Id of the correct option for this card.",
        },
    )
        correctOptionId: string | null

    /**
     * Whether the selected option matched the correct one.
     */
    @Field(
        () => Boolean,
        {
            description: "Whether the selected option was correct.",
        },
    )
        correct: boolean
}

/**
 * Aggregate result of grading a Test submission.
 */
@ObjectType({
    description: "Aggregate result of grading a Test submission.",
})
export class SubmitQuizTestData {
    /**
     * Id of the graded deck.
     */
    @Field(
        () => ID,
        {
            description: "Id of the graded deck.",
        },
    )
        quizDeckId: string

    /**
     * Number of answers graded.
     */
    @Field(
        () => Int,
        {
            description: "Number of answers graded.",
        },
    )
        total: number

    /**
     * Number of correct answers.
     */
    @Field(
        () => Int,
        {
            description: "Number of correct answers.",
        },
    )
        correct: number

    /**
     * Percentage correct (0-100).
     */
    @Field(
        () => Int,
        {
            description: "Percentage correct (0-100).",
        },
    )
        scorePercent: number

    /**
     * Per-card grading breakdown.
     */
    @Field(
        () => [QuizTestCardResultData],
        {
            description: "Per-card grading breakdown.",
        },
    )
        results: Array<QuizTestCardResultData>
}

/**
 * Response wrapper for the submitQuizTest mutation.
 */
@ObjectType({
    description: "Response wrapper for the submitQuizTest mutation.",
})
export class SubmitQuizTestResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<SubmitQuizTestData>
{
    /**
     * The graded test result.
     */
    @Field(
        () => SubmitQuizTestData,
        {
            nullable: true,
            description: "The graded test result.",
        },
    )
        data: SubmitQuizTestData
}
