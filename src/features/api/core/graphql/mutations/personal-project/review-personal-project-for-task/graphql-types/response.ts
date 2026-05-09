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
    description: "Data for review personal project response.",
})
export class ReviewPersonalProjectForTaskResponseData {
    @Field(
        () => ID,
        {
            description: "Created attempt ID.",
        },
    )
        attemptId: string

    @Field(
        () => ID,
        {
            description: "Created job ID for tracking grading progress.",
        },
    )
        jobId: string
}

@ObjectType({
    description: "Response for review personal project mutation.",
})
export class ReviewPersonalProjectForTaskResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ReviewPersonalProjectForTaskResponseData>
{
    @Field(() => ReviewPersonalProjectForTaskResponseData,
        {
            nullable: true,
            description: "The attempt and job data.",
        })
        data: ReviewPersonalProjectForTaskResponseData
}
