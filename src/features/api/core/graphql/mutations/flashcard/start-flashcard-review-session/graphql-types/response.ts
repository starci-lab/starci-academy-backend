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
    description: "A newly-persisted resumable flashcard review session.",
})
/** The newly-persisted resumable flashcard review session. */
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
/**
 * Envelope for a newly opened per-deck review session. `data` is nullable so
 * the transform interceptor can null it on the error path -- a required field
 * would crash GraphQL and hide the real exception.
 */
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
