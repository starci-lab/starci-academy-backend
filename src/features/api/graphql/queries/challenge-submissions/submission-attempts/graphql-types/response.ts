import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    SubmissionAttemptEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Paginated list of submission attempts.",
})
export class SubmissionAttemptsResponseData {
    @Field(
        () => [SubmissionAttemptEntity],
        {
            description: "List of submission attempts.",
        },
    )
        data: Array<SubmissionAttemptEntity>

    @Field(
        () => Int,
        {
            description: "Total number of items matching the filters.",
        },
    )
        count: number
}

@ObjectType({
    description: "Response wrapper for the submissionAttempts query.",
})
export class SubmissionAttemptsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<SubmissionAttemptsResponseData>
{
    @Field(
        () => SubmissionAttemptsResponseData,
        {
            description: "Payload containing the list of submission attempts and total count.",
        },
    )
        data: SubmissionAttemptsResponseData
}
