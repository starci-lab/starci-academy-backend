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
