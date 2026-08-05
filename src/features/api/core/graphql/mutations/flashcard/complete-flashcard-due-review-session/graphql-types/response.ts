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
    description: "The outcome of a finished cross-deck due-review batch session.",
})
/**
 * The outcome of finishing a cross-deck due-review batch session: the
 * reviewed-count and XP bookkeeping values snapshotted onto the row.
 * `xpEarned` here is echoed straight back from the request -- see
 * `CompleteFlashcardDueReviewSessionRequest`'s own doc for why no XP grant
 * happens server-side.
 */
export class CompleteFlashcardDueReviewSessionData {
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
    description: "Response wrapper for the completeFlashcardDueReviewSession mutation.",
})
/**
 * Response wrapper for the completeFlashcardDueReviewSession mutation.
 */
export class CompleteFlashcardDueReviewSessionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CompleteFlashcardDueReviewSessionData> {
    @Field(
        () => CompleteFlashcardDueReviewSessionData,
        {
            nullable: true,
            description: "The outcome of the completed session.",
        },
    )
        data: CompleteFlashcardDueReviewSessionData
}
