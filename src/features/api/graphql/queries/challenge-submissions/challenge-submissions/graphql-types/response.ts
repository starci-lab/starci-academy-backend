import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    ChallengeSubmissionEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "All challenge submissions for a challenge (no pagination).",
})
export class ChallengeSubmissionsResponseData {
    @Field(
        () => [ChallengeSubmissionEntity],
        {
            description: "All challenge submissions for the challenge; each row includes userSubmission for the current user when present.",
        },
    )
        data: Array<ChallengeSubmissionEntity>
}

@ObjectType({
    description: "Response wrapper for the challengeSubmissions query.",
})
export class ChallengeSubmissionsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ChallengeSubmissionsResponseData>
{
    @Field(
        () => ChallengeSubmissionsResponseData,
        {
            description: "Payload containing the full list of challenge submissions.",
        },
    )
        data: ChallengeSubmissionsResponseData
}
