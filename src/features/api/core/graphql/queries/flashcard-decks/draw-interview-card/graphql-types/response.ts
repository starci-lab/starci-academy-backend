import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    FlashcardLevel,
    GraphQLTypeFlashcardLevel,
} from "@modules/databases"

/**
 * A single interview question drawn for the voice-interview mode. Deliberately
 * a thin projection of the card — it exposes only what the candidate needs to
 * answer the question, and never the model `answer`/`explanation`, so opening
 * devtools cannot reveal the expected answer. Grading reloads the answer by id.
 */
@ObjectType({
    description: "A randomly drawn interview question, with the model answer withheld.",
})
export class InterviewCardData {
    @Field(
        () => ID,
        {
            description: "Card id — pass back to gradeInterviewAnswer as flashcardCardId.",
        },
    )
        id: string

    @Field(
        () => ID,
        {
            description: "Deck the card was drawn from — pass back as flashcardDeckId.",
        },
    )
        deckId: string

    @Field(
        () => String,
        {
            description: "The question prompt to read aloud to the candidate (Markdown).",
        },
    )
        question: string

    @Field(
        () => GraphQLTypeFlashcardLevel,
        {
            nullable: true,
            description: "Interview seniority level the question targets, or null.",
        },
    )
        level: FlashcardLevel | null

    @Field(
        () => [String],
        {
            description: "Technology tags for the question (e.g. [\"NestJS\", \"Redis\"]).",
        },
    )
        tags: Array<string>
}

/** Response wrapper for the drawInterviewCard query. */
@ObjectType({
    description: "Response wrapper for the drawInterviewCard query.",
})
export class DrawInterviewCardResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<InterviewCardData>
{
    /** The randomly drawn interview question (model answer withheld). */
    @Field(
        () => InterviewCardData,
        {
            nullable: true,
            description: "The randomly drawn interview question.",
        },
    )
        data: InterviewCardData
}
