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

/** GraphQL envelope for the milestones query. */
@ObjectType({
    description: "Response wrapper for the milestones query.",
})
export class MilestonesResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<MilestoneEntity>>
{
    /** Payload containing the milestones for the requested course. */
    @Field(() => [MilestoneEntity],
        {
            nullable: true,
            description: "The milestones for the requested course.",
        })
        data: Array<MilestoneEntity>
}
