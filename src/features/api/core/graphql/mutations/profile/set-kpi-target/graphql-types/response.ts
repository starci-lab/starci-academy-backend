import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    ObjectType,
} from "@nestjs/graphql"

/** Response for setting one of the current user's weekly KPI targets (no payload). */
@ObjectType({
    description: "Response for setting one of the current user's weekly KPI targets.",
})
export class SetKpiTargetResponse extends AbstractGraphQLResponse {
}
