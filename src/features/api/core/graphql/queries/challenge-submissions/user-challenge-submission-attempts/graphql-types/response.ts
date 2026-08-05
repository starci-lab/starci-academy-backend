import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    UserChallengeSubmissionAttemptEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission-attempt.entity"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

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
