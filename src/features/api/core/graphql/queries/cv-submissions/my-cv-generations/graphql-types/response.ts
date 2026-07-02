import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    UserCvGenerationEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * Response wrapper for `myCvGenerations` — the caller's CV generation runs
 * (newest first). Each row exposes id / mode / status / createdAt / processedAt
 * from {@link UserCvGenerationEntity}.
 */
@ObjectType({
    description: "Response wrapper for the myCvGenerations query.",
})
export class MyCvGenerationsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<UserCvGenerationEntity>>
{
    @Field(
        () => [UserCvGenerationEntity],
        {
            nullable: true,
            description: "The caller's CV generation runs (newest first).",
        },
    )
        data: Array<UserCvGenerationEntity>
}
