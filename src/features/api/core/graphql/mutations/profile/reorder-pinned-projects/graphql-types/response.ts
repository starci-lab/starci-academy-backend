import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    ObjectType,
} from "@nestjs/graphql"

/** Response for reordering pinned projects (no payload). */
@ObjectType({
    description: "Response for reordering the user's pinned projects.",
})
export class ReorderPinnedProjectsResponse extends AbstractGraphQLResponse {
}
