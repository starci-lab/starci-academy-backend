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
    description: "Data for the milestones query.",
})
/** Every milestone in the requested course, ordered by `sortIndex`. */
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
/** GraphQL envelope for the `milestones` list query. */
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
