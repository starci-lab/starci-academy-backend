import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    UserMilestoneTaskAttemptEntity,
} from "@modules/databases/postgresql/primary/entities/user-milestone-task-attempt.entity"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Paginated list of user personal task attempts.",
})
/**
 * Paginated attempt history for the caller on one course+task.
 */
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
/**
 * Envelope for `userPersonalTaskAttempts` -- status metadata plus attempt page.
 */
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
