import {
    Mutation,
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
    MarkAllNotificationsAsReadResponse,
    MarkAllNotificationsAsReadResponseData,
} from "./graphql-types/response"

@Resolver()
/**
 * Marks ALL of the current user's unread notifications as read in one statement
 * (the "mark all read" action on the bell). Returns how many rows were flipped.
 */
export class MarkAllNotificationsAsReadResolver {
    constructor(
        private readonly notificationService: NotificationService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "All notifications marked as read",
        [Locale.Vi]: "Đã đánh dấu tất cả thông báo là đã đọc", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => MarkAllNotificationsAsReadResponse,
        {
            name: "markAllNotificationsAsRead",
            description: "Marks all of the current user's unread notifications as read.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<MarkAllNotificationsAsReadResponseData> {
        // single bulk UPDATE over the unread rows; returns the affected count
        const { markedCount } = await this.notificationService.markAllAsRead({
            userId: user.id,
        })
        return {
            markedCount,
        }
    }
}
