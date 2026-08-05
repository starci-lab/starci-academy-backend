import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    MilestoneEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

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
