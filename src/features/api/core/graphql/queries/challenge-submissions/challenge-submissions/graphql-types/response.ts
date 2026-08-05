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
/**
 * Full unpaginated slot list. Each row may include `userSubmission` for the
 * current caller only -- not other users' progress.
 */
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
/**
 * Envelope for `challengeSubmissions`. Success/error live on the abstract
 * wrapper; the slot list is in `data`.
 */
export class ChallengeSubmissionsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ChallengeSubmissionsResponseData>
{
    @Field(
        () => ChallengeSubmissionsResponseData,
        {
            nullable: true,
            description: "Payload containing the full list of challenge submissions.",
        },
    )
        data: ChallengeSubmissionsResponseData
}
