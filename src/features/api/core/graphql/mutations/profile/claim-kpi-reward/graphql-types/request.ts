import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    GraphQLTypeKpiKey,
    KpiKey,
} from "@modules/databases"

@InputType({
    description: "Request to claim one weekly KPI's coin reward.",
})
/**
 * Request to claim the current user's coin reward for one weekly KPI whose
 * floor target has been met.
 */
export class ClaimKpiRewardRequest {
    @Field(
        () => GraphQLTypeKpiKey,
        {
            description: "Which KPI to claim the reward for.",
        },
    )
        key: KpiKey
}
