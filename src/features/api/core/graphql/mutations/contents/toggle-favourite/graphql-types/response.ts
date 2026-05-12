import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    ObjectType,
} from "@nestjs/graphql"

/** Response for syncing challenge submissions for the current user. */
@ObjectType({
    description: "Response for toggling a content as favourite.",
})
export class ToggleFavouriteResponse extends AbstractGraphQLResponse {
}