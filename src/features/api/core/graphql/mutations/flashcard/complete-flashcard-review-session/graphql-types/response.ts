import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "The outcome of a finished flashcard review session.",
})
/**
 * The outcome of finishing a flashcard review session: the reviewed-count
 * and XP bookkeeping values snapshotted onto the row. `xpEarned` here is
 * echoed straight back from the request -- see
 * `CompleteFlashcardReviewSessionRequest`'s own doc for why no XP grant
 * happens server-side.
 */
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

@ObjectType({
    description: "Response wrapper for the completeFlashcardReviewSession mutation.",
})
/**
 * Response wrapper for the completeFlashcardReviewSession mutation.
 */
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
