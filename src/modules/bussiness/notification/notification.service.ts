import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    IsNull,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    NotificationEntity,
} from "@modules/databases"
import {
    EventEmitterService,
    EventName,
} from "@modules/event"
import {
    NotificationNotFoundException,
} from "@modules/exceptions"
import {
    UserStatsProjectionService,
} from "../projections/user-stats/user-stats-projection.service"
import type {
    CreateNotificationParams,
    ListNotificationsParams,
    ListNotificationsResult,
    MarkAllNotificationsAsReadParams,
    MarkAllNotificationsAsReadResult,
    MarkNotificationAsReadParams,
} from "./types"

/**
 * Domain service for per-user in-app notifications: create + realtime fan-out,
 * paged listing, unread counting, and read-state mutations.
 *
 * Creation persists a private row (starts unread) and emits a local
 * {@link EventName.NotificationCreated} event so the Socket.IO gateway pushes a
 * ready-to-render snapshot to the recipient's bell. Producers elsewhere call
 * {@link createNotification} (optionally passing their own transaction manager)
 * instead of touching the table directly.
 */
@Injectable()
export class NotificationService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly eventEmitterService: EventEmitterService,
        private readonly userStatsProjectionService: UserStatsProjectionService,
    ) {}

    /**
     * Create a notification for one recipient and fan it out in real time.
     * @param params - {@link CreateNotificationParams}
     * @returns The persisted notification row (starts unread).
     */
    async createNotification({
        entityManager,
        userId,
        type,
        title,
        body,
        target,
    }: CreateNotificationParams): Promise<NotificationEntity> {
        // honour the caller's transaction when provided so the notification commits
        // atomically with its source effect; otherwise use the service's own manager
        const manager = entityManager ?? this.entityManager
        // text-free snapshot: i18n title/body (key + params) + optional target
        const metadata = {
            title,
            body,
            target,
        }
        // build the row via relation id only — no need to load the full user row
        const draft = manager.create(NotificationEntity,
            {
                user: {
                    id: userId,
                },
                type,
                // local var is `metadata`; the column is `payload`
                payload: metadata,
                // a fresh notification is always unread until the recipient opens it
                readAt: null,
            })
        // persist; the returned row carries the generated id + timestamps
        const saved = await manager.save(draft)
        // bump the recipient's unread count projection in the same unit of work
        // (CDC on `notifications` also covers this asynchronously)
        await this.userStatsProjectionService.recompute({
            userId,
            entityManager: manager,
        })
        // fan out a local event carrying a self-contained snapshot so the gateway
        // can push a render-ready row to the recipient without re-querying
        await this.eventEmitterService.emit({
            event: EventName.NotificationCreated,
            payload: {
                userId,
                notification: {
                    id: saved.id,
                    type: saved.type,
                    metadata: saved.payload,
                    readAt: saved.readAt,
                    createdAt: saved.createdAt,
                },
            },
        })
        return saved
    }

    /**
     * List a recipient's notifications (newest first), optionally unread-only.
     * @param params - {@link ListNotificationsParams}
     * @returns The page items + total matching rows.
     */
    async listNotifications({
        userId,
        limit,
        offset,
        unreadOnly,
    }: ListNotificationsParams): Promise<ListNotificationsResult> {
        // scope to the recipient; when unread-only, also require readAt to be null
        const [
            items,
            total,
        ] = await this.entityManager.findAndCount(NotificationEntity,
            {
                where: {
                    user: {
                        id: userId,
                    },
                    // spread the unread filter only when requested so the read rows
                    // are not excluded on the default (all) listing
                    ...(unreadOnly
                        ? {
                            readAt: IsNull(),
                        }
                        : {
                        }),
                },
                // bell shows the most recent notifications at the top
                order: {
                    createdAt: "DESC",
                },
                take: limit,
                skip: offset,
            })
        return {
            items,
            total,
        }
    }

    /**
     * Count a recipient's unread notifications (drives the bell badge).
     * @param userId - Recipient id.
     * @returns The number of `readAt IS NULL` rows for the user.
     */
    async countUnread(userId: string): Promise<number> {
        // unread badge now reads the flat user-stats projection (lazy-recomputed
        // if stale) — replaces the old per-request COUNT
        const stats = await this.userStatsProjectionService.getStats(userId)
        return stats.unreadNotificationCount
    }

    /**
     * Stamp a single notification as read. Ownership is folded into the lookup,
     * so another user's row is indistinguishable from a missing one.
     * @param params - {@link MarkNotificationAsReadParams}
     */
    async markAsRead({
        userId,
        notificationId,
    }: MarkNotificationAsReadParams): Promise<void> {
        // load the row scoped to the recipient — never trust the client's ownership
        const notification = await this.entityManager.findOne(NotificationEntity,
            {
                where: {
                    id: notificationId,
                    user: {
                        id: userId,
                    },
                },
                select: {
                    id: true,
                    readAt: true,
                },
            })
        // a missing (or unowned) row is a hard not-found for the caller
        if (!notification) {
            throw new NotificationNotFoundException({
                notificationId,
                userId,
            })
        }
        // already read → idempotent no-op so a double tap never churns the row
        if (notification.readAt) {
            return
        }
        // stamp the read time; the badge drops by one on the next count
        await this.entityManager.update(NotificationEntity,
            {
                id: notificationId,
            },
            {
                readAt: new Date(),
            })
        // refresh the unread-count projection so the badge reflects the read
        await this.userStatsProjectionService.recompute({
            userId,
        })
    }

    /**
     * Stamp ALL of a recipient's unread notifications as read in one statement.
     * @param params - {@link MarkAllNotificationsAsReadParams}
     * @returns How many rows were flipped from unread to read.
     */
    async markAllAsRead({
        userId,
    }: MarkAllNotificationsAsReadParams): Promise<MarkAllNotificationsAsReadResult> {
        // single bulk UPDATE over the unread rows — no per-row round trips
        const result = await this.entityManager.update(NotificationEntity,
            {
                user: {
                    id: userId,
                },
                readAt: IsNull(),
            },
            {
                readAt: new Date(),
            })
        // refresh the unread-count projection (drops to 0 for this user)
        await this.userStatsProjectionService.recompute({
            userId,
        })
        // affected is undefined on some drivers → coerce to 0 for a stable contract
        return {
            markedCount: result.affected ?? 0,
        }
    }
}
