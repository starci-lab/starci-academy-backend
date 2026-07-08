import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * The outcome of finishing a flashcard review session: the reviewed-count
 * and XP bookkeeping values snapshotted onto the row. `xpEarned` here is
 * echoed straight back from the request — see
 * `CompleteFlashcardReviewSessionRequest`'s own doc for why no XP grant
 * happens server-side.
 */
@ObjectType({
    description: "The outcome of a finished flashcard review session.",
})
export class CompleteFlashcardReviewSessionData {
    @Field(
        () => Int,
        {
            description: "The reviewed-card count snapshotted onto the row.",
        },
    )
        reviewedCount: number

    @Field(
        () => Int,
        {
            description: "The XP bookkeeping value snapshotted onto the row (echoed back, not a server grant).",
        },
    )
        xpEarned: number
}

/**
 * Response wrapper for the completeFlashcardReviewSession mutation.
 */
@ObjectType({
    description: "Response wrapper for the completeFlashcardReviewSession mutation.",
})
export class CompleteFlashcardReviewSessionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CompleteFlashcardReviewSessionData> {
    @Field(
        () => CompleteFlashcardReviewSessionData,
        {
            nullable: true,
            description: "The outcome of the completed session.",
        },
    )
        data: CompleteFlashcardReviewSessionData
}
