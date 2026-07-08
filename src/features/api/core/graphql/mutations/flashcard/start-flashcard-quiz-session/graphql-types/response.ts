import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** The newly-persisted resumable flashcard quick-quiz session. */
@ObjectType({
    description: "A newly-persisted resumable flashcard quick-quiz session.",
})
export class StartFlashcardQuizSessionData {
    @Field(
        () => ID,
        {
            description: "Id of the persisted session — pass this to syncFlashcardQuizSessionProgress / completeFlashcardQuizSession.",
        },
    )
        sessionId: string
}

@ObjectType({
    description: "Response wrapper for the startFlashcardQuizSession mutation.",
})
export class StartFlashcardQuizSessionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<StartFlashcardQuizSessionData>
{
    @Field(
        () => StartFlashcardQuizSessionData,
        {
            nullable: true,
            description: "The newly-persisted session.",
        },
    )
        data: StartFlashcardQuizSessionData
}
