import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Data for submit challenge submission mutation.",
})
/**
 * Only the enqueued `jobs.id` -- grading is async; the client subscribes to
 * job notifications rather than blocking on the score.
 */
export class SubmitChallengeSubmissionResponseData {
    @Field(
        () => ID,
        {
            description: "`jobs.id` enqueued for grading.",
        },
    )
        jobId: string
}

@ObjectType({
    description: "Response for submit challenge submissions mutation.",
})
/**
 * Envelope for submitChallengeSubmission. `data` is nullable so interceptor
 * error paths do not crash GraphQL over a missing job id.
 */
export class SubmitChallengeSubmissionResponse extends AbstractGraphQLResponse {
    @Field(
        () => SubmitChallengeSubmissionResponseData,
        {
            nullable: true,
        },
    )
        data: SubmitChallengeSubmissionResponseData
}
