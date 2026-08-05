import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Result of syncing an in-flight mock-interview session's transcript + position.",
})
/**
 * Result of one sync attempt. `success: false` (never a thrown exception) for
 * every "the sync no longer applies" case — session not found, not owned by
 * the caller, or already `status !== "in_progress"` (a late/stale sync that
 * lands after `gradeMockInterviewSession` already completed the session, or
 * after a fresh draw abandoned it) — a background periodic sync must never
 * surface an error toast to a learner who is mid-interview.
 */
export class SyncMockInterviewSessionTurnsData {
    @Field(
        () => Boolean,
        {
            description: "Whether the sync was applied — false when the session is not found/owned, or is no longer \"in_progress\".",
        },
    )
        success: boolean
}

@ObjectType({
    description: "Response wrapper for the syncMockInterviewSessionTurns mutation.",
})
/**
 * Envelope for a background transcript sync. The payload is a soft success
 * flag so a late tick after grade/abandon does not toast the learner
 * mid-interview. `data` is nullable for the interceptor error path.
 */
export class SyncMockInterviewSessionTurnsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<SyncMockInterviewSessionTurnsData>
{
    @Field(
        () => SyncMockInterviewSessionTurnsData,
        {
            nullable: true,
            description: "The sync result.",
        },
    )
        data: SyncMockInterviewSessionTurnsData
}
