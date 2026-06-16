import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    ObjectType,
} from "@nestjs/graphql"

/** Response for setting the current user's weekly learning goal (no payload). */
@ObjectType({
    description: "Response for setting the current user's weekly learning goal.",
})
export class SetWeeklyGoalResponse extends AbstractGraphQLResponse {
}
