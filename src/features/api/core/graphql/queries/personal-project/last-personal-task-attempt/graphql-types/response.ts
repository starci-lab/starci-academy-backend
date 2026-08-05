import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    UserMilestoneTaskAttemptEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Latest personal task review attempt for a user (or null if none).",
})
/**
 * Latest attempt by attemptNumber for the subject, or null when enrolled but
 * never submitted / not enrolled — staff UIs treat null as "no review yet".
 */
export class LastPersonalTaskAttemptResponseData {
    @Field(
        () => UserMilestoneTaskAttemptEntity,
        {
            nullable: true,
            description: "Most recent attempt by attemptNumber, if any.",
        },
    )
        attempt: UserMilestoneTaskAttemptEntity | null
}

@ObjectType({
    description: "Response wrapper for lastPersonalTaskAttempt.",
})
/**
 * Envelope for `lastPersonalTaskAttempt` — status metadata plus attempt-or-null.
 */
export class LastPersonalTaskAttemptResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<LastPersonalTaskAttemptResponseData>
{
    @Field(
        () => LastPersonalTaskAttemptResponseData,
        {
            nullable: true,
            description: "Payload with the latest attempt or null.",
        },
    )
        data: LastPersonalTaskAttemptResponseData
}
