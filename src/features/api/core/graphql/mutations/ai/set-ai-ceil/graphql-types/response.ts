import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    ObjectType,
} from "@nestjs/graphql"

@ObjectType({
    description: "Response for setting the user's AI model ceiling.",
})
/**
 * Response for setting the user's AI model ceiling. Carries no data -- clients
 * re-fetch `myAiQuota` to read the refreshed ceiling + plan state.
 */
export class SetAiCeilResponse extends AbstractGraphQLResponse {
}
