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
 * lands after `gradeMockInterviewSession` already completed the session, or
 * after a fresh draw abandoned it) — a background periodic sync must never
 * surface an error toast to a learner who is mid-interview.
 */
@ObjectType({
    description: "Result of syncing an in-flight mock-interview session's transcript + position.",
})
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
