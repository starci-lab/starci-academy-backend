import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"

@ObjectType({
    description: "One immutable deliverable attempt created by a whole-Challenge submit.",
})
/** Correlates one authored deliverable with the immutable attempt and durable job created for it. */
export class SubmitChallengeSubmissionItemResponseData {
    @Field(() => ID)
        challengeSubmissionId: string

    @Field(() => ID)
        jobId: string

    @Field(() => ID)
        attemptId: string
}

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

    @Field(
        () => ID,
        {
            description: "Immutable attempt created before the grading job is published.",
        },
    )
        attemptId: string

    @Field(
        () => ID,
        {
            nullable: true,
            description: "Logical whole-Challenge attempt identity shared by all submitted deliverables.",
        },
    )
        attemptGroupId?: string

    @Field(
        () => [SubmitChallengeSubmissionItemResponseData],
        {
            nullable: true,
            description: "Every deliverable attempt atomically committed for the whole Challenge.",
        },
    )
        items?: Array<SubmitChallengeSubmissionItemResponseData>
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
