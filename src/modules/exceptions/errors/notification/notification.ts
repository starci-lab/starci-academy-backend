import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when a notification row cannot be located for the requesting user. */
export interface NotificationNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the notification that was not found (or not owned by the user). */
    notificationId: string
    /** Id of the user the lookup was scoped to. */
    userId: string
}

/**
 * Thrown when a notification id does not resolve to a row owned by the user.
 * Ownership is folded into the lookup (a row belonging to another user is
 * indistinguishable from a missing one), so this doubles as the forbidden case.
 */
export class NotificationNotFoundException extends AbstractException {
    constructor(
        {
            notificationId,
            userId,
            originalError,
        }: NotificationNotFoundExceptionMetadata,
    ) {
        super(
            "Notification not found",
            "NOTIFICATION_NOT_FOUND_EXCEPTION",
            {
                notificationId,
                userId,
                originalError,
            },
        )
    }
}
