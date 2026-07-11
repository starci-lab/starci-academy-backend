import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * Result of one sync attempt. `success: false` (never a thrown exception) for
 * every "the sync no longer applies" case — session not found, not owned by
 * the caller, or already `status !== "in_progress"` (a late/stale sync that
 * lands after `completeFlashcardDueReviewSession` already completed the
 * session, or after a fresh draw abandoned it) — a background periodic sync
 * must never surface an error toast to a learner mid-batch. Mirrors
 * `SyncFlashcardReviewSessionProgressData`.
 */
@ObjectType({
    description: "Result of syncing an in-flight cross-deck due-review batch session's position + progress.",
})
export class SyncFlashcardDueReviewSessionProgressData {
    @Field(
        () => Boolean,
        {
            description: "Whether the sync was applied — false when the session is not found/owned, or is no longer \"in_progress\".",
        },
    )
        success: boolean
}

@ObjectType({
    description: "Response wrapper for the syncFlashcardDueReviewSessionProgress mutation.",
})
export class SyncFlashcardDueReviewSessionProgressResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<SyncFlashcardDueReviewSessionProgressData>
{
    @Field(
        () => SyncFlashcardDueReviewSessionProgressData,
        {
            nullable: true,
            description: "The sync result.",
        },
    )
        data: SyncFlashcardDueReviewSessionProgressData
}
