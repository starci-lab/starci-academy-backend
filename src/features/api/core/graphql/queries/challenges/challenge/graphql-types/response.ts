import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Response wrapper for the challenge query.",
})
/**
 * Envelope for `challenge`. Missing or premium-locked challenges throw from
 * the handler rather than returning a null `data` payload.
 */
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
        data: ChallengeEntity
}
