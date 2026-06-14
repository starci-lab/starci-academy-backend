import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    ObjectType,
} from "@nestjs/graphql"

/**
 * Response for marking a single notification as read. Carries no data — clients
 * decrement the badge locally or re-fetch `myUnreadNotificationCount`.
 */
@ObjectType({
    description: "Response for marking a notification as read.",
})
export class MarkNotificationAsReadResponse extends AbstractGraphQLResponse {
}
