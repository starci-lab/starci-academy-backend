import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Result of syncing an in-flight flashcard review session's position + progress.",
})
/**
 * Result of one sync attempt. `success: false` (never a thrown exception) for
 * every "the sync no longer applies" case -- session not found, not owned by
 * the caller, or already `status !== "in_progress"` (a late/stale sync that
 * lands after `completeFlashcardReviewSession` already completed the session,
 * or after a fresh draw abandoned it) -- a background periodic sync must
 * never surface an error toast to a learner mid-quiz. Mirrors
 * `SyncMockInterviewSessionTurnsData`.
 */
export class SyncFlashcardReviewSessionProgressData {
    @Field(
        () => Boolean,
        {
            description: "Whether the sync was applied — false when the session is not found/owned, or is no longer \"in_progress\".",
        },
    )
        success: boolean
}

@ObjectType({
    description: "Response wrapper for the syncFlashcardReviewSessionProgress mutation.",
})
/**
 * Envelope for a background review-session progress sync. The payload is a
 * soft success flag (never an exception) so a late tick after complete/abandon
 * does not toast the learner mid-review. `data` is nullable for the interceptor
 * error path.
 */
export class SyncFlashcardReviewSessionProgressResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<SyncFlashcardReviewSessionProgressData>
{
    @Field(
        () => SyncFlashcardReviewSessionProgressData,
        {
            nullable: true,
            description: "The sync result.",
        },
    )
        data: SyncFlashcardReviewSessionProgressData
}
