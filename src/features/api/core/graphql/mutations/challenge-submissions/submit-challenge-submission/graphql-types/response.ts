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
export class SubmitChallengeSubmissionResponse extends AbstractGraphQLResponse {
    @Field(
        () => SubmitChallengeSubmissionResponseData,
        {
            nullable: true,
        },
    )
        data: SubmitChallengeSubmissionResponseData
}
