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
    description: "Response wrapper for the challengeSubmission query.",
})
export class ChallengeSubmissionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ChallengeSubmissionEntity>
{
    @Field(
        () => ChallengeSubmissionEntity,
        {
            nullable: true,
            description: "The challenge submission for the requested id, including userSubmissions (join rows).",
        },
    )
        data?: ChallengeSubmissionEntity
}
