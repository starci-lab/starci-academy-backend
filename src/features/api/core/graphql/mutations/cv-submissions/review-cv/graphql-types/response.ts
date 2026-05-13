import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Data for queued CV review mutation.",
})
export class ReviewCvResponseData {
    @Field(
        () => ID,
        {
            description: "`jobs.id` enqueued for CV review.",
        },
    )
        jobId: string
}

@ObjectType({
    description: "Response for queuing CV review at a selected rubric level.",
})
export class ReviewCvResponse extends AbstractGraphQLResponse {
    @Field(
        () => ReviewCvResponseData,
        {
            nullable: true,
        },
    )
        data: ReviewCvResponseData
}
