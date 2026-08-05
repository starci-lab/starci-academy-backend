import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    MilestoneEntity,
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Response wrapper for the milestone query.",
})
/** GraphQL envelope for the `milestone` detail query. */
export class MilestoneResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MilestoneEntity>
{
    @Field(
        () => MilestoneEntity,
        {
            nullable: true,
            description: "The milestone for the requested id.",
        },
    )
        data: MilestoneEntity
}
