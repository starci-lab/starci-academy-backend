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
    MarkAllNotificationsAsReadResponse,
    MarkAllNotificationsAsReadResponseData,
} from "./graphql-types"

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
        [Locale.Vi]: "Đã đánh dấu tất cả thông báo là đã đọc",
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
