import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "A newly-persisted resumable flashcard quick-quiz session.",
})
/** The newly-persisted resumable flashcard quick-quiz session. */
export class StartFlashcardQuizSessionData {
    @Field(
        () => ID,
        {
            description: "Id of the persisted session — pass this to syncFlashcardQuizSessionProgress / completeFlashcardQuizSession.",
        },
    )
        sessionId: string

    @Field(
        () => String,
        {
            description: "ISO timestamp of the session's resumable-window deadline (createdAt + duration).",
        },
    )
        deadlineAt: string
}

@ObjectType({
    description: "Response wrapper for the startFlashcardQuizSession mutation.",
})
    /**
     * ISO timestamp of when this run stops being resumable (server
     * `createdAt + FLASHCARD_QUIZ_SESSION_DURATION_MS`) — the FE derives its
     * countdown from THIS, never a local clock start. Mirrors
     * `StartMockInterviewSessionData.deadlineAt`.
     */
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
