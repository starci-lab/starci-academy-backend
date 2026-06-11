import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    AiMode,
    GraphQLTypeAiMode,
} from "@modules/databases"

/**
 * Request for grading a candidate's transcribed answer to an interview
 * flashcard. The server loads the question + model answer from the deck by id —
 * the client never sends the question or rubric. `locale` is taken from the
 * request context decorator, not this input.
 */
@InputType({
    description: "Grade a transcribed interview answer against a flashcard's model answer.",
})
export class GradeInterviewAnswerRequest {
    @Field(
        () => ID,
        {
            description: "Deck the question card belongs to.",
        },
    )
        flashcardDeckId: string

    @Field(
        () => ID,
        {
            description: "Card whose question + model answer drive the grading.",
        },
    )
        flashcardCardId: string

    @Field(
        () => String,
        {
            description: "The candidate's answer, transcribed from speech on the client.",
        },
    )
        transcript: string

    @Field(
        () => GraphQLTypeAiMode,
        {
            nullable: true,
            description: "Optional AI lane override; only the Auto lane is honored in P0.",
        },
    )
        mode?: AiMode
}
