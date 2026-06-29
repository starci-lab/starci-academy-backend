import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    ObjectType,
} from "@nestjs/graphql"

/**
 * Response for setting the user's AI model ceiling. Carries no data — clients
 * re-fetch `myAiQuota` to read the refreshed ceiling + plan state.
 */
@ObjectType({
    description: "Response for setting the user's AI model ceiling.",
})
export class SetAiCeilResponse extends AbstractGraphQLResponse {
}
