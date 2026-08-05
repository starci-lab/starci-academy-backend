import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    ObjectType,
} from "@nestjs/graphql"

@ObjectType({
    description: "Response for removing a pinned project.",
})
/** Response for removing a pinned project (no payload). */
export class UnpinProjectResponse extends AbstractGraphQLResponse {
}
