import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    ObjectType,
} from "@nestjs/graphql"

@ObjectType({
    description: "Response for setting one of the current user's weekly KPI targets.",
})
/** Response for setting one of the current user's weekly KPI targets (no payload). */
export class SetKpiTargetResponse extends AbstractGraphQLResponse {
}
