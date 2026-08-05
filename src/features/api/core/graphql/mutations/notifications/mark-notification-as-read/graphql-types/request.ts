import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Mark a single notification as read.",
})
/**
 * Request to mark a single notification as read. The notification must belong to
 * the authenticated user (ownership is enforced server-side).
 */
export class MarkNotificationAsReadRequest {
    @Field(
        () => ID,
        {
            description: "Id of the notification to stamp as read.",
        },
    )
        notificationId: string
}
