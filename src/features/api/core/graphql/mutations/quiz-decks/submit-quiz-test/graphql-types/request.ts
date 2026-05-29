import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/**
 * One answer in a Test-mode submission: the selected option for a card.
 */
@InputType({
    description: "One Test-mode answer: the selected option for a card.",
})
export class QuizTestAnswerInput {
    /**
     * Id of the card being answered.
     */
    @Field(
        () => ID,
        {
            description: "Id of the card being answered.",
        },
    )
        quizCardId: string

    /**
     * Id of the option the learner selected.
     */
    @Field(
        () => ID,
        {
            description: "Id of the option the learner selected.",
        },
    )
        selectedOptionId: string
}

/**
 * Request for grading a whole Test-mode submission of a deck.
 */
@InputType({
    description: "Grade a whole Test-mode submission of a deck.",
})
export class SubmitQuizTestRequest {
    /**
     * Id of the deck being tested.
     */
    @Field(
        () => ID,
        {
            description: "Id of the deck being tested.",
        },
    )
        quizDeckId: string

    /**
     * The learner's answers, one per attempted card.
     */
    @Field(
        () => [QuizTestAnswerInput],
        {
            description: "The learner's answers, one per attempted card.",
        },
    )
        answers: Array<QuizTestAnswerInput>
}
