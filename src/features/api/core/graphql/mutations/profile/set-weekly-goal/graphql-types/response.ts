import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    ObjectType,
} from "@nestjs/graphql"

@ObjectType({
    description: "Response for setting the current user's weekly learning goal.",
})
/** Response for setting the current user's weekly learning goal (no payload). */
export class SetWeeklyGoalResponse extends AbstractGraphQLResponse {
}
