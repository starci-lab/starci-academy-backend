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
    description: "The created submission id + the judging job id to subscribe to.",
})
/** Identifiers returned after a solution is accepted for judging. */
export class SubmitCodingSolutionResponseData {
    /** Row id to look up submission history/detail; the verdict itself is filled in later by the judge worker. */
    @Field(
        () => ID,
        {
            description: "The created `coding_submissions.id`.",
        },
    )
        submissionId: string

    /** The client must subscribe to this id to learn the verdict -- the mutation itself returns before judging finishes. */
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
/** Response wrapper for the `submitCodingSolution` mutation; the submission/job ids live in {@link data}. */
export class SubmitCodingSolutionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<SubmitCodingSolutionResponseData>
{
    /** Null on error -- inspect the wrapper's status/error fields instead. */
    @Field(
        () => SubmitCodingSolutionResponseData,
        {
            nullable: true,
            description: "The submission + job identifiers.",
        },
    )
        data: SubmitCodingSolutionResponseData
}
