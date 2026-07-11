import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** The newly-persisted resumable due-review batch session. */
@ObjectType({
    description: "A newly-persisted resumable cross-deck due-review batch session.",
})
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
