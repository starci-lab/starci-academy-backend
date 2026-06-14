import type {
    NotificationMetadata,
    NotificationType,
} from "@modules/databases"

/**
 * Self-contained snapshot of a freshly created notification, carried on the
 * {@link NotificationCreatedEventPayload} so the Socket.IO gateway can push a
 * ready-to-render row to the recipient without re-querying the database.
 */
export interface NotificationSnapshot {
    /** Notification row id. */
    id: string
    /** Kind of notification (drives the FE icon + phrasing). */
    type: NotificationType
    /** Text-free snapshot: i18n title/body (key + params) + optional target. */
    metadata: NotificationMetadata | null
    /** Read timestamp; always null on creation (the row starts unread). */
    readAt: Date | null
    /** When the notification was created (used for ordering + relative time). */
    createdAt: Date
}

/**
 * Payload emitted when a notification is created for a single recipient. The
 * gateway forwards it to that recipient's private room so the bell updates in
 * real time (and the unread badge increments).
 */
export interface NotificationCreatedEventPayload {
    /** Recipient user id — the private room key the gateway emits to. */
    userId: string
    /** The created notification, ready for the FE to render. */
    notification: NotificationSnapshot
}
