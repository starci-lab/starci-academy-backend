import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** Identifiers returned after a solution is accepted for judging. */
@ObjectType({
    description: "The created submission id + the judging job id to subscribe to.",
})
export class SubmitCodingSolutionResponseData {
    @Field(
        () => ID,
        {
            description: "The created `coding_submissions.id`.",
        },
    )
        submissionId: string

    @Field(
        () => ID,
        {
            description: "The judging `jobs.id` to subscribe to over Socket.IO for the verdict.",
        },
    )
        jobId: string
}

@ObjectType({
    description: "Response wrapper for the submitCodingSolution mutation.",
})
export class SubmitCodingSolutionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<SubmitCodingSolutionResponseData>
{
    @Field(
        () => SubmitCodingSolutionResponseData,
        {
            nullable: true,
            description: "The submission + job identifiers.",
        },
    )
        data: SubmitCodingSolutionResponseData
}
