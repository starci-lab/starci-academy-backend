import {
    Field,
    InputType,
    Int,
} from "@nestjs/graphql"
import {
    IsInt,
} from "class-validator"
import {
    GraphQLTypeKpiKey,
    KpiKey,
} from "@modules/databases/postgresql/primary/enums/kpi-key"

@InputType({
    description: "Request to set one weekly KPI target for the current user.",
})
/**
 * Request to set one of the authenticated user's weekly KPI targets.
 *
 * `target` is clamped server-side into a sane per-KPI range before it is
 * persisted (so an out-of-range client value is normalized, not rejected); a
 * target of 0 clears that KPI's goal.
 */
export class SetKpiTargetRequest {
    @Field(
        () => GraphQLTypeKpiKey,
        {
            description: "Which KPI to set the target for.",
        },
    )
        key: KpiKey

    @Field(
        () => Int,
        {
            description: "Target value for this KPI; clamped per-KPI on save (0 clears it).",
        },
    )
    // integer target; the resolver clamps the per-KPI range
    @IsInt()
        target: number
}
