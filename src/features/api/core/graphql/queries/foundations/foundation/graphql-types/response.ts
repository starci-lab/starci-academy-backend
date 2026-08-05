import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    FoundationEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Response wrapper for the foundation query.",
})
/** GraphQL envelope for the `foundation` detail query. */
export class FoundationResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<FoundationEntity>
{
    @Field(
        () => FoundationEntity,
        {
            nullable: true,
            description: "Foundation item payload.",
        },
    )
        data: FoundationEntity
}
