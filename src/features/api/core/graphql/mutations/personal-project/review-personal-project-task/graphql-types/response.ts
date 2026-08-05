import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Data for review personal project task response.",
})
/**
 * Only the enqueued review `jobs.id` — scoring is async; the client
 * tracks progress via job notifications.
 */
export class ReviewPersonalProjectTaskResponseData {
    @Field(
        () => ID,
        {
            description: "Created job ID for tracking grading progress.",
        },
    )
        jobId: string
}

@ObjectType({
    description: "Response for review personal project task mutation.",
})
/**
 * Envelope for reviewPersonalProjectTask. `data` is nullable so interceptor
 * error paths do not crash GraphQL over a missing job id.
 */
export class ReviewPersonalProjectTaskResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ReviewPersonalProjectTaskResponseData>
{
    @Field(() => ReviewPersonalProjectTaskResponseData,
        {
            nullable: true,
            description: "The job data.",
        })
        data: ReviewPersonalProjectTaskResponseData
}
