import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    ObjectType,
} from "@nestjs/graphql"

@ObjectType({
    description: "Response for reordering the user's pinned projects.",
})
/** Response for reordering pinned projects (no payload). */
export class ReorderPinnedProjectsResponse extends AbstractGraphQLResponse {
}
