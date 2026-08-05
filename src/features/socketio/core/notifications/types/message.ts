import type {
    NotificationSnapshot,
} from "@modules/event"

/**
 * Server -> client message pushed when a new notification is created for the
 * subscribed recipient. Carries the full snapshot so the bell can prepend the
 * row + bump the unread badge without an extra round trip.
 */
export interface NotificationCreatedSocketIoMessage {
    /** The freshly created notification, ready to render. */
    notification: NotificationSnapshot
}
