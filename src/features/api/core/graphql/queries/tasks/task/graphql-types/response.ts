import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    MilestoneTaskEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Response wrapper for the task query.",
})
/**
 * GraphQL envelope for `task`. `data` is the full milestone-task JSON
 * (nested criteria included) so the task page can render without a second
 * fetch.
 */
export class TaskResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MilestoneTaskEntity>
{
    @Field(
        () => MilestoneTaskEntity,
        {
            nullable: true,
            description: "The milestone task for the requested id.",
        },
    )
        data: MilestoneTaskEntity
}
