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
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    NotificationService,
} from "@modules/bussiness/notification/notification.service"
import {
    MyUnreadNotificationCountResponse,
    MyUnreadNotificationCountResponseData,
} from "./graphql-types/response"

@Resolver()
/**
 * Lightweight unread-count query for the bell badge. Kept separate from
 * `myNotifications` so the FE can poll / refetch just the badge cheaply without
 * pulling the full page.
 */
export class MyUnreadNotificationCountResolver {
    constructor(
        private readonly notificationService: NotificationService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Unread notification count fetched successfully",
        [Locale.Vi]: "Lấy số thông báo chưa đọc thành công", // vn-ok: vi-locale string emitted to clients
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
        // single COUNT over the (user, readAt) index -- cheap enough to poll
        const count = await this.notificationService.countUnread(user.id)
        return {
            count,
        }
    }
}
