import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    ChallengeEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Response wrapper for the challenge query.",
})
export class ChallengeResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ChallengeEntity>
{
    @Field(
        () => ChallengeEntity,
        {
            nullable: true,
            description: "The challenge for the requested id.",
        },
    )
        data?: ChallengeEntity
}
