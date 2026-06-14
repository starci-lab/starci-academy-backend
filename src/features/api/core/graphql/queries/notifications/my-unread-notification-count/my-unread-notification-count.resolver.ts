import {
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
    MyUnreadNotificationCountResponse,
    MyUnreadNotificationCountResponseData,
} from "./graphql-types"

/**
 * Lightweight unread-count query for the bell badge. Kept separate from
 * `myNotifications` so the FE can poll / refetch just the badge cheaply without
 * pulling the full page.
 */
@Resolver()
export class MyUnreadNotificationCountResolver {
    constructor(
        private readonly notificationService: NotificationService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Unread notification count fetched successfully",
        [Locale.Vi]: "Lấy số thông báo chưa đọc thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyUnreadNotificationCountResponse,
        {
            name: "myUnreadNotificationCount",
            description:
                "Returns the authenticated user's unread notification count (the bell badge value).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<MyUnreadNotificationCountResponseData> {
        // single COUNT over the (user, readAt) index — cheap enough to poll
        const count = await this.notificationService.countUnread(user.id)
        return {
            count,
        }
    }
}
