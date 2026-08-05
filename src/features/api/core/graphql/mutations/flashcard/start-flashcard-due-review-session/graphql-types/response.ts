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
    description: "A newly-persisted resumable cross-deck due-review batch session.",
})
/** The newly-persisted resumable due-review batch session. */
export class StartFlashcardDueReviewSessionData {
    @Field(
        () => ID,
        {
            description: "Id of the persisted session — pass this to syncFlashcardDueReviewSessionProgress / completeFlashcardDueReviewSession.",
        },
    )
        sessionId: string
}

@ObjectType({
    description: "Response wrapper for the startFlashcardDueReviewSession mutation.",
})
/**
 * Envelope for a newly opened cross-deck due-review batch. `data` is nullable
 * so the transform interceptor can null it on the error path — a required
 * field would crash GraphQL and hide the real exception.
 */
export class StartFlashcardDueReviewSessionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<StartFlashcardDueReviewSessionData>
{
    @Field(
        () => StartFlashcardDueReviewSessionData,
        {
            nullable: true,
            description: "The newly-persisted session.",
        },
    )
        data: StartFlashcardDueReviewSessionData
}
