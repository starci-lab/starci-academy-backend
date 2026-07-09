import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** The newly-persisted resumable flashcard review session. */
@ObjectType({
    description: "A newly-persisted resumable flashcard review session.",
})
export class StartFlashcardReviewSessionData {
    @Field(
        () => ID,
        {
            description: "Id of the persisted session — pass this to syncFlashcardReviewSessionProgress / completeFlashcardReviewSession.",
        },
    )
        sessionId: string
}

@ObjectType({
    description: "Response wrapper for the startFlashcardReviewSession mutation.",
})
export class StartFlashcardReviewSessionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<StartFlashcardReviewSessionData>
{
    @Field(
        () => StartFlashcardReviewSessionData,
        {
            nullable: true,
            description: "The newly-persisted session.",
        },
    )
        data: StartFlashcardReviewSessionData
}
