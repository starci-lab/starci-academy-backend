import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    ObjectType,
} from "@nestjs/graphql"

/**
 * Response for updating the current user's AI lane settings. Carries no data —
 * clients re-fetch `myAiSettings` to read the refreshed snapshot.
 */
@ObjectType({
    description: "Response for updating the current user's AI lane settings.",
})
export class UpdateMyAiSettingsResponse extends AbstractGraphQLResponse {
}
