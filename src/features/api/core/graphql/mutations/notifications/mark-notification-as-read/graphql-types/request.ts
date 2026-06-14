import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/**
 * Request to mark a single notification as read. The notification must belong to
 * the authenticated user (ownership is enforced server-side).
 */
@InputType({
    description: "Mark a single notification as read.",
})
export class MarkNotificationAsReadRequest {
    @Field(
        () => ID,
        {
            description: "Id of the notification to stamp as read.",
        },
    )
        notificationId: string
}
