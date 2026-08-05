import type {
    EntityManager,
} from "typeorm"
import type {
    NotificationEntity,
    NotificationI18nText,
    NotificationTargetRef,
} from "@modules/databases/postgresql/primary/entities/notification.entity"
import type {
    NotificationType,
} from "@modules/databases/postgresql/primary/enums/notification-type"

/** Params for {@link NotificationService.createNotification}. */
export interface CreateNotificationParams {
    /**
     * Optional transaction manager so the notification is written in the SAME tx
     * as its source effect (e.g. inside the grading transaction). Defaults to the
     * service's primary manager when omitted.
     */
    entityManager?: EntityManager
    /** Recipient the notification is delivered to. */
    userId: string
    /** Kind of notification (drives the FE icon + phrasing). */
    type: NotificationType
    /** Headline as an i18n descriptor (key + params) -- no stored text. */
    title: NotificationI18nText
    /** Optional supporting line as an i18n descriptor; omit when title is enough. */
    body?: NotificationI18nText
    /** Optional clickable target (entityName + id) for the bell row. */
    target?: NotificationTargetRef
}

/** Params for {@link NotificationService.listNotifications}. */
export interface ListNotificationsParams {
    /** Recipient whose notifications are listed. */
    userId: string
    /** Max rows to return (already clamped by the caller). */
    limit: number
    /** Rows to skip for pagination. */
    offset: number
    /** When true, restrict the page to unread (`readAt IS NULL`) rows only. */
    unreadOnly: boolean
    /** Optional kind filter; when omitted, notifications of every type are listed. */
    type?: NotificationType
}

/** Result of {@link NotificationService.listNotifications}. */
export interface ListNotificationsResult {
    /** Notification rows for the requested page, newest first. */
    items: Array<NotificationEntity>
    /** Total rows matching the filter (across all pages), for the FE pager. */
    total: number
}

/** Params for {@link NotificationService.markAsRead}. */
export interface MarkNotificationAsReadParams {
    /** Recipient performing the action (ownership is enforced on this id). */
    userId: string
    /** Notification to stamp as read. */
    notificationId: string
}

/** Params for {@link NotificationService.markAllAsRead}. */
export interface MarkAllNotificationsAsReadParams {
    /** Recipient whose unread notifications are all stamped read. */
    userId: string
}

/** Result of {@link NotificationService.markAllAsRead}. */
export interface MarkAllNotificationsAsReadResult {
    /** Number of rows flipped from unread to read by this call. */
    markedCount: number
}
