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
    description: "Data for the milestones query.",
})
export class MilestonesResponseData {
    @Field(
        () => [MilestoneEntity],
        {
            description: "All milestones for the course.",
        },
    )
        data: Array<MilestoneEntity>
}

@ObjectType({
    description: "Response wrapper for the milestones query.",
})
export class MilestonesResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MilestonesResponseData>
{
    @Field(
        () => MilestonesResponseData,
        {
            nullable: true,
            description: "Payload containing milestones.",
        },
    )
        data: MilestonesResponseData
}
