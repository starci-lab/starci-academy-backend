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
