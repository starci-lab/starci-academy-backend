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
    MarkNotificationAsReadRequest,
    MarkNotificationAsReadResponse,
} from "./graphql-types"

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
        [Locale.Vi]: "Đã đánh dấu thông báo là đã đọc",
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
