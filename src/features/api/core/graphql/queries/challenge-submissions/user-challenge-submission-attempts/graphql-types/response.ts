import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    UserChallengeSubmissionAttemptEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Paginated list of submission attempts.",
})
/**
 * One page of the caller's attempts on a submission, plus the unpaginated
 * match count for building page controls.
 */
export class UserChallengeSubmissionAttemptsResponseData {
    @Field(
        () => [UserChallengeSubmissionAttemptEntity],
        {
            description: "List of submission attempts.",
        },
    )
        data: Array<UserChallengeSubmissionAttemptEntity>

    @Field(
        () => Int,
        {
            description: "Total number of items matching the filters.",
        },
    )
        count: number
}

@ObjectType({
    description: "Response wrapper for the userChallengeSubmissionAttempts query.",
})
/**
 * Envelope for `userChallengeSubmissionAttempts`. An empty join (user never
 * attempted) still succeeds with `{ data: [], count: 0 }`.
 */
export class UserChallengeSubmissionAttemptsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<UserChallengeSubmissionAttemptsResponseData>
{
    @Field(
        () => UserChallengeSubmissionAttemptsResponseData,
        {
            nullable: true,
            description: "Payload containing the list of submission attempts and total count.",
        },
    )
        data: UserChallengeSubmissionAttemptsResponseData
}
