import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    FoundationEntity,
} from "@modules/databases/postgresql/primary/entities/foundation.entity"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

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
