import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * Data payload for the submitEvalChallenge mutation: the created eval run id and
 * the enqueued grading job id (the FE subscribes to the job over the existing
 * job-notifications socket, then polls `aiLabEvalResult` once it completes).
 */
@ObjectType({
    description: "Data for the submitEvalChallenge mutation.",
})
export class SubmitEvalChallengeResponseData {
    @Field(
        () => ID,
        {
            description: "Created eval run id (status Pending until the job grades it).",
        },
    )
        evalRunId: string

    @Field(
        () => ID,
        {
            description: "Enqueued grading job id; subscribe over the job-notifications socket.",
        },
    )
        jobId: string
}

/**
 * Response wrapper for the submitEvalChallenge mutation.
 */
@ObjectType({
    description: "Response for the submitEvalChallenge mutation.",
})
export class SubmitEvalChallengeResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<SubmitEvalChallengeResponseData>
{
    @Field(
        () => SubmitEvalChallengeResponseData,
        {
            nullable: true,
        },
    )
        data: SubmitEvalChallengeResponseData
}
