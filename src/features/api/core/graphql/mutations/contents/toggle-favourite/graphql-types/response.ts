import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    ObjectType,
} from "@nestjs/graphql"

@ObjectType({
    description: "Response for toggling a content as favourite.",
})
/** Response for syncing challenge submissions for the current user. */
export class ToggleFavouriteResponse extends AbstractGraphQLResponse {
}