import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    ObjectType,
} from "@nestjs/graphql"

/** Response for removing a pinned project (no payload). */
@ObjectType({
    description: "Response for removing a pinned project.",
})
export class UnpinProjectResponse extends AbstractGraphQLResponse {
}
