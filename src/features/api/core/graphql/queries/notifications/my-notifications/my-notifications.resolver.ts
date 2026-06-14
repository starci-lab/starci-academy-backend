import {
    Args,
    Int,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    NotificationService,
} from "@modules/bussiness"
import {
    MyNotificationsResponse,
    MyNotificationsResponseData,
} from "./graphql-types"

/** Hard ceiling on page size to keep the bell query cheap. */
const MAX_LIMIT = 100

/**
 * Per-user notification bell list (newest first), paginated, with the unread
 * total folded in so the FE renders the list + badge from one round trip.
 * Reads `notifications` directly (not cached) — the bell is viewed on demand.
 */
@Resolver()
export class MyNotificationsResolver {
    constructor(
        private readonly notificationService: NotificationService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Notifications fetched successfully",
        [Locale.Vi]: "Lấy thông báo thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyNotificationsResponse,
        {
            name: "myNotifications",
            description:
                "Returns the authenticated user's paginated notifications (newest first) "
                + "plus the unread count for the bell badge.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("limit",
            {
                type: () => Int,
                nullable: true,
                defaultValue: 20,
            })
            limit: number,
        @Args("offset",
            {
                type: () => Int,
                nullable: true,
                defaultValue: 0,
            })
            offset: number,
        @Args("unreadOnly",
            {
                type: () => Boolean,
                nullable: true,
                defaultValue: false,
            })
            unreadOnly: boolean,
    ): Promise<MyNotificationsResponseData> {
        // run the page query + unread count together — both are cheap index reads
        const [
            page,
            unreadCount,
        ] = await Promise.all([
            this.notificationService.listNotifications({
                userId: user.id,
                // clamp the page size into [1, MAX_LIMIT] so a hostile client can't
                // ask for an unbounded scan
                limit: Math.min(Math.max(limit ?? 20,
                    1),
                MAX_LIMIT),
                offset: Math.max(offset ?? 0,
                    0),
                unreadOnly: unreadOnly ?? false,
            }),
            this.notificationService.countUnread(user.id),
        ])
        return {
            // map each entity to its GraphQL shape; isRead is derived from readAt
            items: page.items.map((notification) => ({
                id: notification.id,
                type: notification.type,
                // text-free: title/body are i18n descriptors in payload
                // (normalise optional params → null for the GraphQL object shape)
                title: {
                    key: notification.payload?.title?.key ?? "",
                    params: notification.payload?.title?.params ?? null,
                },
                body: notification.payload?.body
                    ? {
                        key: notification.payload.body.key,
                        params: notification.payload.body.params ?? null,
                    }
                    : null,
                // a stamped readAt means the recipient has seen it
                isRead: notification.readAt !== null,
                // surface the clickable target snapshot when present
                target: notification.payload?.target ?? null,
                readAt: notification.readAt,
                createdAt: notification.createdAt,
            })),
            total: page.total,
            unreadCount,
        }
    }
}
