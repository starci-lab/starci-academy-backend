import {
    Field,
    Int,
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
    description: "Paginated list of user personal task attempts.",
})
export class UserPersonalTaskAttemptsResponseData {
    @Field(
        () => [UserMilestoneTaskAttemptEntity],
        {
            description: "List of user personal task attempts.",
        },
    )
        data: Array<UserMilestoneTaskAttemptEntity>

    @Field(
        () => Int,
        {
            description: "Total number of items matching the filters.",
        },
    )
        count: number
}

@ObjectType({
    description: "Response wrapper for the userPersonalTaskAttempts query.",
})
export class UserPersonalTaskAttemptsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<UserPersonalTaskAttemptsResponseData>
{
    @Field(
        () => UserPersonalTaskAttemptsResponseData,
        {
            nullable: true,
            description: "Payload containing the list of user personal task attempts and total count.",
        },
    )
        data: UserPersonalTaskAttemptsResponseData
}
