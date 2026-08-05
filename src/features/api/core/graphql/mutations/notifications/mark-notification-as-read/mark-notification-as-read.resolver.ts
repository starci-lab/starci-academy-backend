import {
    Args,
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
    MarkNotificationAsReadRequest,
} from "./graphql-types/request"
import {
    MarkNotificationAsReadResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Marks one of the current user's notifications as read. Ownership is enforced
 * in the service (an unowned id behaves exactly like a missing one).
 */
export class MarkNotificationAsReadResolver {
    constructor(
        private readonly notificationService: NotificationService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Notification marked as read",
        [Locale.Vi]: "Đã đánh dấu thông báo là đã đọc", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => MarkNotificationAsReadResponse,
        {
            name: "markNotificationAsRead",
            description: "Marks one of the current user's notifications as read.",
        },
    )
    async execute(
        @Args("request")
            request: MarkNotificationAsReadRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<void> {
        // stamp the read time; the service throws if the row is missing/unowned
        await this.notificationService.markAsRead({
            userId: user.id,
            notificationId: request.notificationId,
        })
    }
}
